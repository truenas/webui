import { Component } from '@angular/core';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AclMode, AclType } from 'app/enums/acl-type.enum';
import { DatasetAclType } from 'app/enums/dataset-acl-type.enum';
import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DatasetFormData } from 'app/pages/storage/volumes/datasets/dataset-form/dataset-form-data.interface';
import { StorageService, WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

type SizeField = 'quota' | 'refquota' | 'reservation' | 'refreservation' | 'special_small_block_size';

@UntilDestroy()
@Component({
  selector: 'app-dataset-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DatasetFormComponent implements FormConfiguration {
  title: string;
  volid: string;
  isBasicMode = true;
  pk: string;
  customFilter: any[] = [];
  queryCall: 'pool.dataset.query' = 'pool.dataset.query';
  isEntity = true;
  isNew = false;
  parent_dataset: Dataset;
  protected entityForm: EntityFormComponent;
  minimum_recommended_dataset_recordsize = '128K';
  protected recordsize_field: FieldConfig;
  protected recordsize_fg: FormControl;
  protected recommended_size_number: number;
  protected recordsize_warning: string;
  protected dedup_value: string;
  protected dedup_fg: FormControl;
  protected dedup_field: FieldConfig;
  protected encrypted_parent = false;
  protected inherit_encryption = true;
  protected non_encrypted_warned = false;
  protected encryption_type = 'key';
  protected generate_key = true;
  namesInUse: string[] = [];
  nameIsCaseInsensitive = false;
  productType: ProductType;

  humanReadable: { [key in SizeField]: string } = {
    quota: '', refquota: '', reservation: '', refreservation: '', special_small_block_size: '',
  };

  private minquota = 1024 * 1024 * 1024; // 1G minimum
  private minrefquota = 1024 * 1024 * 1024;

  parent: string;
  protected passphrase_parent = false;

  protected size_fields: SizeField[] = [
    'quota', 'refquota', 'reservation', 'refreservation', 'special_small_block_size',
  ];
  protected OrigSize: { [field in SizeField]?: any } = {};
  protected OrigHuman: { [field in SizeField]?: any } = {};

  protected warning = 80;
  protected critical = 95;

  custActions = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => {
        this.setBasicMode(true);
      },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => {
        this.setBasicMode(false);
      },
    },
  ];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: helptext.dataset_form_name_section_placeholder,
      class: 'name',
      label: true,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.dataset_form_name_placeholder,
          tooltip: helptext.dataset_form_name_tooltip,
          readonly: true,
          required: true,
          validation: [Validators.required, forbiddenValues(this.namesInUse, this.nameIsCaseInsensitive)],
        },
        {
          type: 'input',
          name: 'comments',
          placeholder: helptext.dataset_form_comments_placeholder,
          tooltip: helptext.dataset_form_comments_tooltip,
        },
        {
          type: 'select',
          name: 'sync',
          placeholder: helptext.dataset_form_sync_placeholder,
          tooltip: helptext.dataset_form_sync_tooltip,
          options: [
            { label: 'Standard', value: 'STANDARD' },
            { label: 'Always', value: 'ALWAYS' },
            { label: 'Disabled', value: 'DISABLED' },
          ],
        },
        {
          type: 'select',
          name: 'compression',
          placeholder: helptext.dataset_form_compression_placeholder,
          tooltip: helptext.dataset_form_compression_tooltip,
          options: [],
        },
        {
          type: 'select',
          name: 'atime',
          placeholder: helptext.dataset_form_atime_placeholder,
          tooltip: helptext.dataset_form_atime_tooltip,
          options: [
            { label: 'on', value: 'ON' },
            { label: 'off', value: 'OFF' },
          ],
        }],
    },
    { name: 'quota_divider', divider: true, maxWidth: true },
    {
      name: helptext.dataset_form_refdataset_section_placeholder,
      class: 'refdataset',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'refquota',
          placeholder: helptext.dataset_form_refquota_placeholder,
          tooltip: helptext.dataset_form_refquota_tooltip,
          class: 'inline',
          width: '100%',
          blurEvent: () => this.blurEventRefQuota(),
          blurStatus: true,
          parent: this,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'refquota');

              const size = this.convertHumanStringToNum(control.value, 'refquota');
              const errors = control.value && Number.isNaN(size)
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                const size_err = control.value && (size != 0) && (size < this.minrefquota)
                  ? { invalid_size: true }
                  : null;

                if (size_err) {
                  config.hasErrors = true;
                  config.errors = helptext.dataset_form_quota_too_small;
                } else {
                  config.hasErrors = false;
                  config.errors = '';
                }
              }

              return errors;
            },
          ],
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'refquota_warning',
          placeholder: helptext.dataset_form_refquota_warning_placeholder,
          class: 'inline',
          width: '50%',
          min: 0,
          value: this.warning,
          validation: helptext.dataset_form_refquota_warning_validation,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'refquota_warning_inherit',
                value: true,
              }],
            }],
        },
        {
          type: 'checkbox',
          name: 'refquota_warning_inherit',
          placeholder: helptext.dataset_form_inherit,
          class: 'inline',
          width: '20%',
          value: true,
          tooltip: helptext.dataset_form_refquota_warning_tooltip,
          expandedHeight: true,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'refquota_critical',
          placeholder: helptext.dataset_form_refquota_critical_placeholder,
          class: 'inline',
          width: '50%',
          value: this.critical,
          min: 0,
          validation: helptext.dataset_form_refquota_critical_validation,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'refquota_critical_inherit',
                value: true,
              }],
            }],
        },
        {
          type: 'checkbox',
          name: 'refquota_critical_inherit',
          placeholder: helptext.dataset_form_inherit,
          class: 'inline',
          width: '20%',
          value: true,
          tooltip: helptext.dataset_form_refquota_critical_tooltip,
          expandedHeight: true,
        },
        {
          type: 'input',
          name: 'refreservation',
          placeholder: helptext.dataset_form_refreservation_placeholder,
          tooltip: helptext.dataset_form_refreservation_tooltip,
          class: 'inline',
          width: '100%',
          blurEvent: () => this.blurEventRefReservation(),
          blurStatus: true,
          parent: this,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'refreservation');

              const errors = control.value && Number.isNaN(this.convertHumanStringToNum(control.value, 'refreservation'))
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
        }],
    },
    {
      name: helptext.dataset_form_dataset_section_placeholder,
      class: 'dataset',
      label: true,
      width: '50%',
      config: [
        {
          type: 'input',
          name: 'quota',
          placeholder: helptext.dataset_form_quota_placeholder,
          tooltip: helptext.dataset_form_quota_tooltip,
          class: 'inline',
          width: '100%',
          blurEvent: () => this.blurEventQuota(),
          blurStatus: true,
          parent: this,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'quota');

              const size = this.convertHumanStringToNum(control.value, 'quota');
              const errors = control.value && Number.isNaN(size)
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                const size_err = control.value && (size != 0) && (size < this.minquota)
                  ? { invalid_size: true }
                  : null;

                if (size_err) {
                  config.hasErrors = true;
                  config.errors = helptext.dataset_form_quota_too_small;
                } else {
                  config.hasErrors = false;
                  config.errors = '';
                }
              }

              return errors;
            },
          ],
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'quota_warning',
          placeholder: helptext.dataset_form_quota_warning_placeholder,
          class: 'inline',
          width: '50%',
          min: 0,
          value: this.warning,
          validation: helptext.dataset_form_quota_warning_validation,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'quota_warning_inherit',
                value: true,
              }],
            }],
        },
        {
          type: 'checkbox',
          name: 'quota_warning_inherit',
          placeholder: helptext.dataset_form_inherit,
          class: 'inline',
          width: '20%',
          value: true,
          tooltip: helptext.dataset_form_quota_warning_tooltip,
          expandedHeight: true,
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'quota_critical',
          placeholder: helptext.dataset_form_quota_critical_placeholder,
          class: 'inline',
          width: '50%',
          min: 0,
          value: this.critical,
          validation: helptext.dataset_form_quota_critical_validation,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'quota_critical_inherit',
                value: true,
              }],
            }],
        },
        {
          type: 'checkbox',
          name: 'quota_critical_inherit',
          placeholder: helptext.dataset_form_inherit,
          class: 'inline',
          width: '20%',
          value: true,
          tooltip: helptext.dataset_form_quota_critical_tooltip,
          expandedHeight: true,
        },
        {
          type: 'input',
          name: 'reservation',
          placeholder: helptext.dataset_form_reservation_placeholder,
          tooltip: helptext.dataset_form_reservation_tooltip,
          class: 'inline',
          width: '100%',
          blurEvent: () => this.blurEventReservation(),
          blurStatus: true,
          parent: this,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'reservation');

              const errors = control.value && Number.isNaN(this.convertHumanStringToNum(control.value, 'reservation'))
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            },
          ],
        }],
    },
    { name: 'encryption_divider', divider: true },
    {
      name: helptext.dataset_form_encryption.fieldset_title,
      class: 'encryption',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'inherit_encryption',
          class: 'inline',
          width: '50%',
          placeholder: helptext.dataset_form_encryption.inherit_checkbox_placeholder,
          tooltip: helptext.dataset_form_encryption.inherit_checkbox_tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'encryption',
          class: 'inline',
          width: '50%',
          placeholder: helptext.dataset_form_encryption.encryption_checkbox_placeholder,
          tooltip: helptext.dataset_form_encryption.encryption_checkbox_tooltip,
          value: true,
        },
        {
          type: 'select',
          name: 'encryption_type',
          placeholder: helptext.dataset_form_encryption.encryption_type_placeholder,
          tooltip: helptext.dataset_form_encryption.encryption_type_tooltip,
          value: 'key',
          options: helptext.dataset_form_encryption.encryption_type_options,
        },
        {
          type: 'checkbox',
          name: 'generate_key',
          placeholder: helptext.dataset_form_encryption.generate_key_checkbox_placeholder,
          tooltip: helptext.dataset_form_encryption.generate_key_checkbox_tooltip,
          value: true,
        },
        {
          type: 'textarea',
          name: 'key',
          placeholder: helptext.dataset_form_encryption.key_placeholder,
          tooltip: helptext.dataset_form_encryption.key_tooltip,
          validation: helptext.dataset_form_encryption.key_validation,
          required: true,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'passphrase',
          inputType: 'password',
          placeholder: helptext.dataset_form_encryption.passphrase_placeholder,
          tooltip: helptext.dataset_form_encryption.passphrase_tooltip,
          validation: helptext.dataset_form_encryption.passphrase_validation,
          togglePw: true,
          required: true,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'input',
          placeholder: helptext.dataset_form_encryption.confirm_passphrase_placeholder,
          name: 'confirm_passphrase',
          inputType: 'password',
          required: true,
          togglePw: true,
          validation: helptext.dataset_form_encryption.confirm_passphrase_validation,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'input',
          name: 'pbkdf2iters',
          placeholder: helptext.dataset_form_encryption.pbkdf2iters_placeholder,
          tooltip: helptext.dataset_form_encryption.pbkdf2iters_tooltip,
          required: true,
          value: 350000,
          validation: helptext.dataset_form_encryption.pbkdf2iters_validation,
          disabled: true,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'algorithm',
          placeholder: helptext.dataset_form_encryption.algorithm_placeholder,
          tooltip: helptext.dataset_form_encryption.algorithm_tooltip,
          required: true,
          value: 'AES-256-GCM',
          options: [],
          disabled: true,
          isHidden: true,
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.dataset_form_other_section_placeholder,
      class: 'options',
      label: true,
      config: [
        {
          type: 'select',
          name: 'deduplication',
          label: helptext.dataset_form_deduplication_label,
          placeholder: helptext.dataset_form_deduplication_placeholder,
          tooltip: helptext.dataset_form_deduplication_tooltip,
          options: [
            { label: 'on', value: DeduplicationSetting.On },
            { label: 'verify', value: DeduplicationSetting.Verify },
            { label: 'off', value: DeduplicationSetting.Off },
          ],
          disabled: true,
          isHidden: true,
        },
        {
          type: 'select',
          name: 'readonly',
          placeholder: helptext.dataset_form_readonly_placeholder,
          tooltip: helptext.dataset_form_readonly_tooltip,
          options: [
            { label: 'On', value: 'ON' },
            { label: 'Off', value: 'OFF' },
          ],
        },
        {
          type: 'select',
          name: 'exec',
          placeholder: helptext.dataset_form_exec_placeholder,
          tooltip: helptext.dataset_form_exec_tooltip,
          options: [
            { label: 'On', value: 'ON' },
            { label: 'Off', value: 'OFF' },
          ],
        },
        {
          type: 'select',
          name: 'snapdir',
          placeholder: helptext.dataset_form_snapdir_placeholder,
          tooltip: helptext.dataset_form_snapdir_tooltip,
          options: [
            { label: 'Visible', value: 'VISIBLE' },
            { label: 'Invisible', value: 'HIDDEN' },
          ],
        },
        {
          type: 'select',
          name: 'copies',
          placeholder: helptext.dataset_form_copies_placeholder,
          tooltip: helptext.dataset_form_copies_tooltip,
          options: [
            { label: '1', value: '1' },
            { label: '2', value: '2' },
            { label: '3', value: '3' },
          ],
          value: 1,
        },
        {
          type: 'select',
          name: 'recordsize',
          placeholder: helptext.dataset_form_recordsize_placeholder,
          tooltip: helptext.dataset_form_recordsize_tooltip,
          options: [
            {
              label: '512', value: '512', disable: true, hiddenFromDisplay: true,
            },
            {
              label: '1 KiB', value: '1K', disable: true, hiddenFromDisplay: true,
            },
            {
              label: '2 KiB', value: '2K', disable: true, hiddenFromDisplay: true,
            },
            { label: '4 KiB', value: '4K' },
            { label: '8 KiB', value: '8K' },
            { label: '16 KiB', value: '16K' },
            { label: '32 KiB', value: '32K' },
            { label: '64 KiB', value: '64K' },
            { label: '128 KiB', value: '128K' },
            { label: '256 KiB', value: '256K' },
            { label: '512 KiB', value: '512K' },
            { label: '1 MiB', value: '1M' },
          ],
        },
        {
          type: 'select',
          name: 'acltype',
          placeholder: T('ACL Type'),
          options: [
            { label: T('Inherit'), value: DatasetAclType.Inherit },
            { label: T('Off'), value: DatasetAclType.Off },
            { label: T('NFSv4'), value: DatasetAclType.Nfsv4 },
            { label: T('POSIX'), value: DatasetAclType.Posix },
          ],
          required: false,
          value: DatasetAclType.Inherit,
          onChangeOption: (event: { event: MatSelectChange }) => {
            const aclModeFormControl = this.entityForm.formGroup.get('aclmode') as FormControl;
            const value = event.event.value;
            if (value === DatasetAclType.Nfsv4) {
              aclModeFormControl.setValue(AclMode.Passthrough);
              this.entityForm.setDisabled('aclmode', false, false);
            } else if (value === DatasetAclType.Posix || value === DatasetAclType.Off) {
              aclModeFormControl.setValue(AclMode.Discard);
              this.entityForm.setDisabled('aclmode', true, false);
            } else if (value === DatasetAclType.Inherit) {
              aclModeFormControl.setValue(AclMode.Inherit);
              this.entityForm.setDisabled('aclmode', true, false);
            }
            this.dialogService.info('ACL Types & ACL Modes', helptext.acl_type_change_warning);
          },
        },
        {
          type: 'select',
          name: 'aclmode',
          placeholder: helptext.dataset_form_aclmode_placeholder,
          tooltip: helptext.dataset_form_aclmode_tooltip,
          options: [
            { label: T('Inherit'), value: AclMode.Inherit },
            { label: T('Passthrough'), value: AclMode.Passthrough },
            { label: T('Restricted'), value: AclMode.Restricted },
            { label: T('Discard'), value: AclMode.Discard },
          ],
          value: AclMode.Inherit,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'acltype',
                value: DatasetAclType.Inherit,
              }],
            },
          ],
        },
        {
          type: 'select',
          name: 'casesensitivity',
          placeholder: helptext.dataset_form_casesensitivity_placeholder,
          tooltip: helptext.dataset_form_casesensitivity_tooltip,
          options: [
            { label: 'Sensitive', value: 'SENSITIVE' },
            { label: 'Insensitive', value: 'INSENSITIVE' },
            { label: 'Mixed', value: 'MIXED' },
          ],
          value: 'SENSITIVE',
        },
        {
          type: 'input',
          name: 'special_small_block_size',
          placeholder: helptext.dataset_form_special_small_blocks_placeholder,
          tooltip: helptext.dataset_form_special_small_blocks_tooltip,
          blurEvent: () => this.blurSpecialSmallBlocks(),
          blurStatus: true,
          parent: this,
          validation: [
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'special_small_block_size');

              const size = this.convertHumanStringToNum(control.value, 'special_small_block_size');
              const errors = control.value && Number.isNaN(size)
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                config.hasErrors = false;
                config.errors = '';
              }

              return errors;
            }],
        },
        {
          type: 'select',
          name: 'share_type',
          placeholder: helptext.dataset_form_share_type_placeholder,
          tooltip: helptext.dataset_form_share_type_tooltip,
          options: [{ label: 'Generic', value: 'GENERIC' },
            { label: 'SMB', value: 'SMB' }],
          value: 'GENERIC',
          disabled: true,
          isHidden: true,
        }],
    },
    { name: 'divider', divider: true },
  ];

  advanced_field = [
    'refquota',
    'quota',
    'quota_unit',
    'refreservation',
    'reservation',
    'readonly',
    'snapdir',
    'copies',
    'recordsize',
    'exec',
    'quota_warning',
    'quota_critical',
    'quota_warning_inherit',
    'quota_critical_inherit',
    'refquota_warning',
    'refquota_critical',
    'refquota_warning_inherit',
    'refquota_critical_inherit',
    'special_small_block_size',
    'acltype',
    'aclmode',
  ];

  encryption_fields = [
    'encryption_type',
    'generate_key',
    'algorithm',
  ];

  key_fields = [
    'key',
  ];

  passphrase_fields = [
    'passphrase',
    'confirm_passphrase',
    'pbkdf2iters',
  ];

  protected byteMap = {
    T: 1099511627776,
    G: 1073741824,
    M: 1048576,
    K: 1024,
    B: 1,
  };
  protected recordSizeMap = {
    512: '512',
    1024: '1K',
    2048: '2K',
    4096: '4K',
    8192: '8K',
    16384: '16K',
    32768: '32K',
    65536: '64K',
    131072: '128K',
    262144: '256K',
    524288: '512K',
    1048576: '1024K',
  };
  protected reverseRecordSizeMap = {
    512: '512',
    '1K': '1024',
    '2K': '2048',
    '4K': '4096',
    '8K': '8192',
    '16K': '16384',
    '32K': '32768',
    '64K': '65536',
    '128K': '131072',
    '256K': '262144',
    '512K': '524288',
    '1024K': '1048576',
    '1M': '1048576',
  };

  setBasicMode(basic_mode: boolean): void {
    this.isBasicMode = basic_mode;
    if (this.encrypted_parent && !this.inherit_encryption) {
      _.find(this.fieldConfig, { name: 'encryption' }).isHidden = basic_mode;
    }
    _.find(this.fieldSets, { class: 'dataset' }).label = !basic_mode;
    _.find(this.fieldSets, { class: 'refdataset' }).label = !basic_mode;
    _.find(this.fieldSets, { name: 'quota_divider' }).divider = !basic_mode;
  }

  convertHumanStringToNum(hstr: any, field: SizeField): number {
    let num = 0;
    let unit = '';

    // empty value is evaluated as null
    if (!hstr) {
      this.humanReadable[field] = null;
      return null;
    }

    if (typeof hstr === 'number') {
      hstr = hstr.toString();
    }

    // remove whitespace
    hstr = hstr.replace(/\s+/g, '');

    // get leading number
    if (num = hstr.match(/^(\d+(\.\d+)?)/)) {
      num = (num as any)[1];
    } else {
      // leading number is required
      this.humanReadable[field] = '';
      return NaN;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    if ((unit) && !(unit = this.storageService.normalizeUnit(unit))) {
      // error when unit is present but not recognized
      this.humanReadable[field] = '';
      return NaN;
    }

    const spacer = (unit) ? ' ' : '';

    this.humanReadable[field] = num.toString() + spacer + unit;
    return num * this.storageService.convertUnitToNum(unit);
  }

  sendAsBasicOrAdvanced(data: any): DatasetFormData {
    if (!this.isNew) {
      delete data.name;
    } else {
      data.name = this.parent + '/' + data.name;
    }

    if (this.isNew && this.isBasicMode) {
      data.refquota = null;
      data.quota = null;
      data.refreservation = null;
      data.reservation = null;
      data.special_small_block_size = null;
      data.copies = (data.copies !== undefined && data.copies !== null && data.name !== undefined) ? '1' : undefined;
    }
    // calculate and delete _unit
    this.size_fields.forEach((field) => {
      if (this.OrigHuman[field] !== data[field]) {
        data[field] = Math.round(this.convertHumanStringToNum(data[field], field));
      } else if (data[field] === null) {
        delete data[field];
      } else {
        data[field] = this.OrigSize[field];
      }
    });

    return data;
  }

  blurEventQuota(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['quota'].setValue(this.humanReadable['quota']);
    }
  }

  blurEventRefQuota(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['refquota'].setValue(this.humanReadable['refquota']);
    }
  }

  blurEventReservation(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['reservation'].setValue(this.humanReadable['reservation']);
    }
  }

  blurEventRefReservation(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['refreservation'].setValue(this.humanReadable['refreservation']);
    }
  }

  blurSpecialSmallBlocks(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['special_small_block_size'].setValue(this.humanReadable['special_small_block_size']);
    }
  }

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected storageService: StorageService,
    protected modalService: ModalService,
  ) { }

  initial(entityForm: EntityFormComponent): void {
    const aclModeFormControl = this.entityForm.formGroup.get('aclmode') as FormControl;
    const value = entityForm.formGroup.get('acltype').value;
    if (value === DatasetAclType.Nfsv4) {
      this.entityForm.setDisabled('aclmode', false, false);
    } else if (value === DatasetAclType.Posix || value === DatasetAclType.Off) {
      aclModeFormControl.setValue(AclMode.Discard);
      this.entityForm.setDisabled('aclmode', true, false);
    } else if (value === DatasetAclType.Inherit) {
      aclModeFormControl.setValue(AclMode.Inherit);
      this.entityForm.setDisabled('aclmode', true, false);
    }
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.productType = window.localStorage.getItem('product_type') as ProductType;
    const aclControl = entityForm.formGroup.get('aclmode');
    this.entityForm = entityForm;
    if (this.productType.includes(ProductType.Enterprise)) {
      this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.includes(LicenseFeature.Dedup)) {
          this.entityForm.setDisabled('deduplication', false, false);
        }
      });
    } else {
      this.entityForm.setDisabled('deduplication', false, false);
    }

    this.dedup_fg = this.entityForm.formGroup.controls['deduplication'] as FormControl;
    this.dedup_field = _.find(this.fieldConfig, { name: 'deduplication' });
    this.dedup_value = this.dedup_fg.value;
    this.dedup_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((dedup: DeduplicationSetting) => {
      if (dedup === DeduplicationSetting.Inherit || dedup === DeduplicationSetting.Off) {
        this.dedup_field.warnings = '';
      } else {
        this.dedup_field.warnings = helptext.dataset_form_deduplication_warning;
      }
    });

    if (!this.parent) {
      _.find(this.fieldConfig, { name: 'quota_warning_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'quota_critical_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'refquota_warning_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'refquota_critical_inherit' }).placeholder = helptext.dataset_form_default;
    }
    if (!entityForm.isNew) {
      entityForm.setDisabled('casesensitivity', true);
      entityForm.setDisabled('name', true);
      _.find(this.fieldConfig, { name: 'name' }).tooltip = 'Dataset name (read-only).';
      this.encryption_fields.forEach((field) => {
        this.entityForm.setDisabled(field, true, true);
      });
      _.find(this.fieldSets, { name: 'encryption_divider' }).divider = false;
      this.entityForm.setDisabled('encryption', true, true);
      this.entityForm.setDisabled('inherit_encryption', true, true);
    } else {
      entityForm.setDisabled('share_type', false, false);
    }

    entityForm.formGroup.get('share_type').valueChanges.pipe(filter((shareType) => !!shareType && entityForm.isNew)).pipe(untilDestroyed(this)).subscribe((shareType) => {
      const caseControl = entityForm.formGroup.get('casesensitivity');
      if (shareType === 'SMB') {
        aclControl.setValue(AclMode.Restricted);
        caseControl.setValue('INSENSITIVE');
        aclControl.disable();
        caseControl.disable();
      } else {
        aclControl.setValue(AclMode.Passthrough);
        caseControl.setValue('SENSITIVE');
        aclControl.enable();
        caseControl.enable();
      }
      aclControl.updateValueAndValidity();
      caseControl.updateValueAndValidity();
    });

    this.recordsize_fg = this.entityForm.formGroup.controls['recordsize'] as FormControl;

    this.recordsize_field = _.find(this.fieldConfig, { name: 'recordsize' });
    this.recordsize_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((record_size: string) => {
      const record_size_number = parseInt((this.reverseRecordSizeMap as any)[record_size], 10);
      if (this.minimum_recommended_dataset_recordsize && this.recommended_size_number) {
        this.recordsize_warning = helptext.dataset_form_warning_1
          + this.minimum_recommended_dataset_recordsize
          + helptext.dataset_form_warning_2;
        if (record_size_number < this.recommended_size_number) {
          this.recordsize_field.warnings = this.recordsize_warning;
          this.isBasicMode = false;
        } else {
          this.recordsize_field.warnings = null;
        }
      }
    });
    this.setBasicMode(this.isBasicMode);
  }

  paramMap: {
    volid?: string;
    pk?: string;
    parent?: any;
  };

  preInit(entityForm: EntityFormComponent): void {
    this.volid = this.paramMap['volid'];

    if (this.paramMap['pk'] !== undefined) {
      this.pk = this.paramMap['pk'];

      const pk_parent = this.paramMap['pk'].split('/');
      this.parent = pk_parent.splice(0, pk_parent.length - 1).join('/');
      this.customFilter = [[['id', '=', this.pk]]];
    }
    // add new dataset
    if (this.paramMap['parent'] || this.paramMap['pk'] === undefined) {
      this.parent = this.paramMap['parent'];
      this.pk = this.parent;
      this.isNew = true;
      this.fieldSets[0].config[0].readonly = false;
      _.find(this.fieldSets, { class: 'dataset' }).label = false;
      _.find(this.fieldSets, { class: 'refdataset' }).label = false;
    }
    this.ws.call('pool.dataset.compression_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
      for (const key in choices) {
        compression.options.push({ label: key, value: choices[key] });
      }
    });

    if (this.parent) {
      const root = this.parent.split('/')[0];
      this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(untilDestroyed(this)).subscribe((res) => {
        this.minimum_recommended_dataset_recordsize = res;
        this.recommended_size_number = parseInt(
          (this.reverseRecordSizeMap as any)[this.minimum_recommended_dataset_recordsize], 0,
        );
      });

      this.ws.call('pool.dataset.query', [[['id', '=', this.pk]]]).pipe(untilDestroyed(this)).subscribe(
        (pk_dataset) => {
          this.encrypted_parent = pk_dataset[0].encrypted;
          let inherit_encrypt_placeholder = helptext.dataset_form_encryption.inherit_checkbox_notencrypted;
          if (this.encrypted_parent) {
            if (pk_dataset[0].key_format.value === DatasetEncryptionType.Passphrase) {
              this.passphrase_parent = true;
              // if parent is passphrase this dataset cannot be a key type
              this.encryption_type = 'passphrase';
              _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
            }
            inherit_encrypt_placeholder = helptext.dataset_form_encryption.inherit_checkbox_encrypted;
          }
          _.find(this.fieldConfig, { name: 'inherit_encryption' }).placeholder = inherit_encrypt_placeholder;
          const children = (pk_dataset[0].children);
          if (pk_dataset[0].casesensitivity.value === 'SENSITIVE') {
            this.nameIsCaseInsensitive = false;
          } else {
            this.nameIsCaseInsensitive = true;
          }
          if (children.length > 0) {
            children.forEach((child) => {
              if (this.nameIsCaseInsensitive) {
                this.namesInUse.push(/[^/]*$/.exec(child.name)[0].toLowerCase());
              } else {
                this.namesInUse.push(/[^/]*$/.exec(child.name)[0]);
              }
            });
          }

          if (this.isNew) {
            const encryption_algorithm_fc = _.find(this.fieldConfig, { name: 'algorithm' }) as FormSelectConfig;
            const encryption_algorithm_fg = this.entityForm.formGroup.controls['algorithm'];
            let parent_algorithm;
            if (this.encrypted_parent && pk_dataset[0].encryption_algorithm) {
              parent_algorithm = pk_dataset[0].encryption_algorithm.value;
              encryption_algorithm_fg.setValue(parent_algorithm);
            }
            this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(untilDestroyed(this)).subscribe((algorithms) => {
              encryption_algorithm_fc.options = [];
              for (const algorithm in algorithms) {
                if (algorithms.hasOwnProperty(algorithm)) {
                  encryption_algorithm_fc.options.push({ label: algorithm, value: algorithm });
                }
              }
            });
            _.find(this.fieldConfig, { name: 'encryption' }).isHidden = true;
            const inherit_encryption_fg = this.entityForm.formGroup.controls['inherit_encryption'];
            const encryption_fg = this.entityForm.formGroup.controls['encryption'];
            const encryption_type_fg = this.entityForm.formGroup.controls['encryption_type'];
            const all_encryption_fields = this.encryption_fields.concat(this.key_fields, this.passphrase_fields);
            if (this.passphrase_parent) {
              encryption_type_fg.setValue('passphrase');
            }
            this.encryption_fields.forEach((field) => {
              this.entityForm.setDisabled(field, true, true);
            });
            inherit_encryption_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((inherit: boolean) => {
              this.inherit_encryption = inherit;
              if (inherit) {
                all_encryption_fields.forEach((field) => {
                  this.entityForm.setDisabled(field, inherit, inherit);
                });
                _.find(this.fieldConfig, { name: 'encryption' }).isHidden = inherit;
              }
              if (!inherit) {
                this.entityForm.setDisabled('encryption_type', inherit, inherit);
                this.entityForm.setDisabled('algorithm', inherit, inherit);
                if (this.passphrase_parent) { // keep it hidden if it passphrase
                  _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
                }
                const key = (this.encryption_type === 'key');
                this.entityForm.setDisabled('passphrase', key, key);
                this.entityForm.setDisabled('confirm_passphrase', key, key);
                this.entityForm.setDisabled('pbkdf2iters', key, key);
                this.entityForm.setDisabled('generate_key', !key, !key);
                if (this.encrypted_parent) {
                  _.find(this.fieldConfig, { name: 'encryption' }).isHidden = this.isBasicMode;
                } else {
                  _.find(this.fieldConfig, { name: 'encryption' }).isHidden = inherit;
                }
              }
            });
            encryption_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((encryption: boolean) => {
              // if on an encrypted parent we should warn the user, otherwise just disable the fields
              if (this.encrypted_parent && !encryption && !this.non_encrypted_warned) {
                this.dialogService.confirm({
                  title: helptext.dataset_form_encryption.non_encrypted_warning_title,
                  message: helptext.dataset_form_encryption.non_encrypted_warning_warning,
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this),
                ).subscribe(() => {
                  this.non_encrypted_warned = true;
                  all_encryption_fields.forEach((field) => {
                    if (field !== 'encryption') {
                      this.entityForm.setDisabled(field, true, true);
                    }
                  });
                });
              } else {
                this.encryption_fields.forEach((field) => {
                  if (field !== 'encryption') {
                    if (field === 'generate_key' && this.encryption_type !== 'key') {
                      return;
                    }

                    this.entityForm.setDisabled(field, !encryption, !encryption);
                  }
                });
                if (this.encryption_type === 'key' && !this.generate_key) {
                  this.entityForm.setDisabled('key', !encryption, !encryption);
                }
                if (this.encryption_type === 'passphrase') {
                  this.passphrase_fields.forEach((field) => {
                    this.entityForm.setDisabled(field, !encryption, !encryption);
                  });
                }
                if (this.passphrase_parent) { // keep this field hidden if parent has a passphrase
                  _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
                }
              }
            });
            encryption_type_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((type: string) => {
              this.encryption_type = type;
              const key = (type === 'key');
              this.entityForm.setDisabled('passphrase', key, key);
              this.entityForm.setDisabled('confirm_passphrase', key, key);
              this.entityForm.setDisabled('pbkdf2iters', key, key);
              this.entityForm.setDisabled('generate_key', !key, !key);
              if (key) {
                this.entityForm.setDisabled('key', this.generate_key, this.generate_key);
              } else {
                this.entityForm.setDisabled('key', true, true);
              }
            });
            this.entityForm.formGroup.controls['generate_key'].valueChanges.pipe(untilDestroyed(this)).subscribe((generate_key: boolean) => {
              this.generate_key = generate_key;
              this.entityForm.setDisabled('key', generate_key, generate_key);
            });

            const sync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
            const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
            const deduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
            const exec = _.find(this.fieldConfig, { name: 'exec' }) as FormSelectConfig;
            const readonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
            const atime = _.find(this.fieldConfig, { name: 'atime' }) as FormSelectConfig;
            const recordsize = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;
            const sync_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT' }];
            const compression_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT' }];
            const deduplication_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT' }];
            const exec_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].exec.rawvalue})`, value: 'INHERIT' }];
            const readonly_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].readonly.rawvalue})`, value: 'INHERIT' }];
            const atime_inherit: Option[] = [{ label: `Inherit (${pk_dataset[0].atime.rawvalue})`, value: 'INHERIT' }];
            this.storageService.convertHumanStringToNum(pk_dataset[0].recordsize.value);
            const recordsize_inherit: Option[] = [{ label: `Inherit (${this.storageService.humanReadable})`, value: 'INHERIT' }];
            if (pk_dataset[0].refquota_critical && pk_dataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['refquota_critical'].setValue(pk_dataset[0].refquota_critical.value);
            }
            if (pk_dataset[0].refquota_warning && pk_dataset[0].refquota_warning.value) {
              entityForm.formGroup.controls['refquota_warning'].setValue(pk_dataset[0].refquota_warning.value);
            }
            if (pk_dataset[0].refquota_critical && pk_dataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['quota_critical'].setValue(pk_dataset[0].quota_critical.value);
            }
            if (pk_dataset[0].refquota_critical && pk_dataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['quota_warning'].setValue(pk_dataset[0].quota_warning.value);
            }

            sync.options = sync_inherit.concat(sync.options);
            compression.options = compression_inherit.concat(compression.options);
            deduplication.options = deduplication_inherit.concat(deduplication.options);
            exec.options = exec_inherit.concat(exec.options);
            readonly.options = readonly_inherit.concat(readonly.options);
            atime.options = atime_inherit.concat(atime.options);
            recordsize.options = recordsize_inherit.concat(recordsize.options);

            entityForm.formGroup.controls['sync'].setValue('INHERIT');
            entityForm.formGroup.controls['compression'].setValue('INHERIT');
            entityForm.formGroup.controls['deduplication'].setValue('INHERIT');
            entityForm.formGroup.controls['exec'].setValue('INHERIT');
            entityForm.formGroup.controls['readonly'].setValue('INHERIT');
            entityForm.formGroup.controls['atime'].setValue('INHERIT');
            entityForm.formGroup.controls['recordsize'].setValue('INHERIT');
          } else {
            this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).pipe(untilDestroyed(this)).subscribe((parent_dataset) => {
              this.parent_dataset = parent_dataset[0];
              const current_dataset = _.find(this.parent_dataset.children, { name: this.pk });
              if (current_dataset.hasOwnProperty('recordsize') && current_dataset['recordsize'].value) {
                const config = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;
                (_.find(config.options, { value: current_dataset['recordsize'].value }) as any)['hiddenFromDisplay'] = false;
              }
              const edit_sync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
              const edit_compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
              const edit_deduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
              const edit_exec = _.find(this.fieldConfig, { name: 'exec' }) as FormSelectConfig;
              const edit_readonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
              const edit_atime = _.find(this.fieldConfig, { name: 'atime' }) as FormSelectConfig;
              const edit_recordsize = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;

              const edit_sync_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.sync.rawvalue})`, value: 'INHERIT' }];
              edit_sync.options = edit_sync_collection.concat(edit_sync.options);

              const edit_compression_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.compression.rawvalue})`, value: 'INHERIT' }];
              edit_compression.options = edit_compression_collection.concat(edit_compression.options);

              const edit_deduplication_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.deduplication.rawvalue})`, value: 'INHERIT' }];
              edit_deduplication.options = edit_deduplication_collection.concat(edit_deduplication.options);

              const edit_exec_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.exec.rawvalue})`, value: 'INHERIT' }];
              edit_exec.options = edit_exec_collection.concat(edit_exec.options);

              const edit_readonly_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.readonly.rawvalue})`, value: 'INHERIT' }];
              edit_readonly.options = edit_readonly_collection.concat(edit_readonly.options);

              const edit_atime_collection: Option[] = [{ label: `Inherit (${this.parent_dataset.atime.rawvalue})`, value: 'INHERIT' }];
              edit_atime.options = edit_atime_collection.concat(edit_atime.options);

              const lastChar = this.parent_dataset.recordsize.value[this.parent_dataset.recordsize.value.length - 1];
              const formattedLabel = lastChar === 'K' || lastChar === 'M'
                ? `${this.parent_dataset.recordsize.value.slice(0, -1)} ${lastChar}iB`
                : this.parent_dataset.recordsize.value;
              const edit_recordsize_collection: Option[] = [{ label: `Inherit (${formattedLabel})`, value: 'INHERIT' }];
              edit_recordsize.options = edit_recordsize_collection.concat(edit_recordsize.options);
              let sync_value = pk_dataset[0].sync.value;
              if (pk_dataset[0].sync.source === ZfsPropertySource.Default) {
                sync_value = 'INHERIT';
              }
              entityForm.formGroup.controls['sync'].setValue(sync_value);

              let compression_value = pk_dataset[0].compression.value;
              if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].compression.source)) {
                compression_value = 'INHERIT';
              }
              entityForm.formGroup.controls['compression'].setValue(compression_value);

              let deduplication_value = pk_dataset[0].deduplication.value;
              if (
                [ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].deduplication.source)
              ) {
                deduplication_value = 'INHERIT';
              }
              let exec_value = pk_dataset[0].exec.value;
              if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].exec.source)) {
                exec_value = 'INHERIT';
              }
              let readonly_value = pk_dataset[0].readonly.value;
              if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].readonly.source)) {
                readonly_value = 'INHERIT';
              }
              let atime_value = pk_dataset[0].atime.value;
              if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].atime.source)) {
                atime_value = 'INHERIT';
              }
              let recordsize_value = pk_dataset[0].recordsize.value;
              if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pk_dataset[0].recordsize.source)) {
                recordsize_value = 'INHERIT';
              }

              entityForm.formGroup.controls['deduplication'].setValue(deduplication_value);
              entityForm.formGroup.controls['exec'].setValue(exec_value);
              entityForm.formGroup.controls['readonly'].setValue(readonly_value);
              entityForm.formGroup.controls['atime'].setValue(atime_value);
              entityForm.formGroup.controls['recordsize'].setValue(recordsize_value);
              this.parent_dataset = parent_dataset[0];
            });
          }
        },
      );
    }
  }

  getFieldValueOrRaw(field: any): any {
    if (field === undefined || field.value === undefined) {
      return field;
    }
    return field.value;
  }

  getFieldValueOrNone(field: ZfsProperty<unknown>): any {
    if (field === undefined || field.value === undefined) {
      return null;
    }
    return field.value;
  }

  isInherited(field: ZfsProperty<unknown>, value: unknown): boolean {
    if (!field) {
      return true;
    }
    if (!value || !field.source || field.source === 'INHERITED' || field.source === 'DEFAULT') {
      return true;
    }
    return false;
  }

  resourceTransformIncomingRestData(wsResponse: Dataset): DatasetFormData {
    if (wsResponse.special_small_block_size && wsResponse.special_small_block_size.rawvalue === '0') {
      delete wsResponse.special_small_block_size;
    }
    const quota_warning = this.getFieldValueOrNone(wsResponse.quota_warning)
      ? this.getFieldValueOrNone(wsResponse.quota_warning)
      : this.warning;
    const quota_warning_inherit = this.isInherited(wsResponse.quota_warning, quota_warning);
    const quota_critical = this.getFieldValueOrNone(wsResponse.quota_critical)
      ? this.getFieldValueOrNone(wsResponse.quota_critical)
      : this.critical;
    const quota_critical_inherit = this.isInherited(wsResponse.quota_critical, quota_critical);
    const refquota_warning = this.getFieldValueOrNone(wsResponse.refquota_warning)
      ? this.getFieldValueOrNone(wsResponse.refquota_warning)
      : this.warning;
    const refquota_warning_inherit = this.isInherited(wsResponse.refquota_warning, refquota_warning);
    const refquota_critical = this.getFieldValueOrNone(wsResponse.refquota_critical)
      ? this.getFieldValueOrNone(wsResponse.refquota_critical)
      : this.critical;
    const refquota_critical_inherit = this.isInherited(wsResponse.refquota_critical, refquota_critical);
    const sizeValues: { [field in SizeField]?: any } = {};
    this.size_fields.forEach((field) => {
      if (wsResponse[field] && wsResponse[field].rawvalue) {
        this.OrigSize[field] = wsResponse[field].rawvalue;
      }
      sizeValues[field] = this.getFieldValueOrRaw(wsResponse[field]);
      this.convertHumanStringToNum(sizeValues[field], field);
      this.OrigHuman[field] = this.humanReadable[field];
    });

    const returnValue: DatasetFormData = {
      name: this.getFieldValueOrRaw(wsResponse.name),
      atime: this.getFieldValueOrRaw(wsResponse.atime),
      share_type: this.getFieldValueOrRaw(wsResponse.share_type),
      acltype: this.getFieldValueOrRaw(wsResponse.acltype),
      aclmode: this.getFieldValueOrRaw(wsResponse.aclmode),
      casesensitivity: this.getFieldValueOrRaw(wsResponse.casesensitivity),
      comments: wsResponse.comments === undefined ? undefined : (wsResponse.comments.source === 'LOCAL' ? wsResponse.comments.value : undefined),
      compression: this.getFieldValueOrRaw(wsResponse.compression),
      copies: this.getFieldValueOrRaw(wsResponse.copies),
      deduplication: this.getFieldValueOrRaw(wsResponse.deduplication),
      quota_warning,
      quota_warning_inherit,
      quota_critical,
      quota_critical_inherit,
      refquota_warning,
      refquota_warning_inherit,
      refquota_critical,
      refquota_critical_inherit,
      quota: this.OrigHuman['quota'],
      readonly: this.getFieldValueOrRaw(wsResponse.readonly),
      exec: this.getFieldValueOrRaw(wsResponse.exec),
      recordsize: this.getFieldValueOrRaw(wsResponse.recordsize),
      refquota: this.OrigHuman['refquota'],
      refreservation: this.OrigHuman['refreservation'],
      reservation: this.OrigHuman['reservation'],
      snapdir: this.getFieldValueOrRaw(wsResponse.snapdir),
      sync: this.getFieldValueOrRaw(wsResponse.sync),
      special_small_block_size: this.OrigHuman['special_small_block_size'],
    };

    if (
      sizeValues['quota']
      || sizeValues['refquota']
      || sizeValues['refreservation']
      || sizeValues['reservation']
      || sizeValues['special_small_block_size']
      || !quota_warning_inherit
      || !quota_critical_inherit
      || !refquota_warning_inherit
      || !refquota_critical_inherit
      || quota_warning !== this.warning
      || quota_critical !== this.critical
      || refquota_critical !== this.critical
      || refquota_warning !== this.warning
    ) {
      this.isBasicMode = false;
    }

    return returnValue;
  }

  // TODO: Similar to addSubmit.
  editSubmit(body: any): Observable<any> {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data['special_small_block_size'] === 0) {
      delete data.special_small_block_size;
    }

    if (data.quota_warning_inherit) {
      delete (data.quota_warning);
    }
    if (data.quota_critical_inherit) {
      delete (data.quota_critical);
    }
    if (data.refquota_warning_inherit) {
      delete (data.refquota_warning);
    }
    if (data.refquota_critical_inherit) {
      delete (data.refquota_critical);
    }
    delete (data.quota_warning_inherit);
    delete (data.quota_critical_inherit);
    delete (data.refquota_warning_inherit);
    delete (data.refquota_critical_inherit);
    if (!data.quota_warning) {
      delete data.quota_warning;
    }
    if (!data.quota_critical) {
      delete data.quota_critical;
    }
    if (!data.refquota_warning) {
      delete data.refquota_warning;
    }
    if (!data.refquota_critical) {
      delete data.refquota_critical;
    }

    if (data.recordsize === '1M') {
      data.recordsize = '1024K';
    }

    if (data.acltype === DatasetAclType.Posix || data.acltype === DatasetAclType.Off) {
      data.aclmode = AclMode.Discard;
    } else if (data.acltype === DatasetAclType.Inherit) {
      data.aclmode = AclMode.Inherit;
    }
    return this.ws.call('pool.dataset.update', [this.pk, data]);
  }

  addSubmit(body: any): Observable<any> {
    const data: any = this.sendAsBasicOrAdvanced(body);
    if (data['special_small_block_size'] === 0) {
      delete data.special_small_block_size;
    }

    if (data.quota_warning_inherit) {
      delete (data.quota_warning);
    }
    if (data.quota_critical_inherit) {
      delete (data.quota_critical);
    }
    if (data.refquota_warning_inherit) {
      delete (data.refquota_warning);
    }
    if (data.refquota_critical_inherit) {
      delete (data.refquota_critical);
    }
    delete (data.quota_warning_inherit);
    delete (data.quota_critical_inherit);
    delete (data.refquota_warning_inherit);
    delete (data.refquota_critical_inherit);

    if (data.recordsize === 'INHERIT') {
      delete (data.recordsize);
    }
    if (data.sync === 'INHERIT') {
      delete (data.sync);
    }
    if (data.compression === 'INHERIT') {
      delete (data.compression);
    }
    if (data.atime === 'INHERIT') {
      delete (data.atime);
    }
    if (data.exec === 'INHERIT') {
      delete (data.exec);
    }
    if (data.readonly === 'INHERIT') {
      delete (data.readonly);
    }
    if (data.deduplication === 'INHERIT') {
      delete (data.deduplication);
    }
    if (data.recordsize === '1M') {
      data.recordsize = '1024K';
    }
    // encryption values
    if (data.inherit_encryption) {
      delete data.encryption;
    } else if (data.encryption) {
      data['encryption_options'] = {};
      if (data.encryption_type === 'key') {
        data.encryption_options.generate_key = data.generate_key;
        if (!data.generate_key) {
          data.encryption_options.key = data.key;
        }
      } else if (data.encryption_type === 'passphrase') {
        data.encryption_options.passphrase = data.passphrase;
        data.encryption_options.pbkdf2iters = data.pbkdf2iters;
      }
      data.encryption_options.algorithm = data.algorithm;
    }
    delete data.key;
    delete data.generate_key;
    delete data.passphrase;
    delete data.confirm_passphrase;
    delete data.pbkdf2iters;
    delete data.encryption_type;
    delete data.algorithm;

    if (data.acltype === DatasetAclType.Posix || data.acltype === DatasetAclType.Off) {
      data.aclmode = AclMode.Discard;
    } else if (data.acltype === DatasetAclType.Inherit) {
      data.aclmode = AclMode.Inherit;
    }
    return this.ws.call('pool.dataset.create', [data]);
  }

  customSubmit(body: any): Subscription {
    this.loader.open();

    const operation$ = this.isNew ? this.addSubmit(body) : this.editSubmit(body);
    return operation$.pipe(untilDestroyed(this)).subscribe((restPostResp) => {
      this.loader.close();
      this.modalService.close('slide-in-form');
      const parentPath = `/mnt/${this.parent}`;
      this.ws.call('filesystem.acl_is_trivial', [parentPath]).pipe(untilDestroyed(this)).subscribe((res) => {
        if (!res) {
          this.dialogService.confirm({
            title: helptext.afterSubmitDialog.title,
            message: helptext.afterSubmitDialog.message,
            hideCheckBox: true,
            buttonMsg: helptext.afterSubmitDialog.actionBtn,
            cancelMsg: helptext.afterSubmitDialog.cancelBtn,
          }).pipe(untilDestroyed(this)).subscribe((res) => {
            if (res) {
              this.ws.call('filesystem.getacl', [parentPath]).pipe(untilDestroyed(this)).subscribe(({ acltype }) => {
                if (acltype === AclType.Posix1e) {
                  this.router.navigate(
                    ['/', 'storage', 'id', restPostResp.pool, 'dataset', 'posix-acl', restPostResp.name],
                    { queryParams: { default: parentPath } },
                  );
                } else {
                  this.router.navigate(
                    ['/', 'storage', 'id', restPostResp.pool, 'dataset', 'acl', restPostResp.name],
                    { queryParams: { default: parentPath } },
                  );
                }
              });
            } else {
              this.modalService.close('slide-in-form');
            }
          });
        } else {
          this.modalService.close('slide-in-form');
        }
        this.modalService.refreshTable();
      });
    }, (res) => {
      this.loader.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  setParent(id: string): void {
    if (!this.paramMap) {
      this.paramMap = {};
    }
    this.paramMap.parent = id;
  }

  setVolId(pool: string): void {
    if (!this.paramMap) {
      this.paramMap = {};
    }
    this.paramMap.volid = pool;
  }
  setPk(id: string): void {
    if (!this.paramMap) {
      this.paramMap = {};
    }
    this.paramMap.pk = id;
  }

  setTitle(title: string): void {
    this.title = T(title);
  }
}
