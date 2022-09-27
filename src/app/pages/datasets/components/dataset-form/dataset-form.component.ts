import { Component } from '@angular/core';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AclMode, AclType } from 'app/enums/acl-type.enum';
import {
  DatasetAclType,
  DatasetCaseSensitivity,
  DatasetChecksum,
  DatasetEncryptionType, DatasetRecordSize,
  DatasetShareType,
  DatasetSync, DatasetSnapdev,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { singleArrayToOptions } from 'app/helpers/options.helper';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/datasets/dataset-form';
import { Dataset, ExtraDatasetQueryOptions } from 'app/interfaces/dataset.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DatasetFormData } from 'app/pages/datasets/components/dataset-form/dataset-form-data.interface';
import { StorageService, SystemGeneralService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

type SizeField = 'quota' | 'refquota' | 'reservation' | 'refreservation' | 'special_small_block_size';

@UntilDestroy()
@Component({
  template: '<ix-entity-form [conf]="this"></ix-entity-form>',
})
export class DatasetFormComponent implements FormConfiguration {
  title: string;
  volid: string;
  isBasicMode = true;
  pk: string;
  customFilter: QueryParams<Dataset, ExtraDatasetQueryOptions> = [];
  queryCall = 'pool.dataset.query' as const;
  isEntity = true;
  isNew = false;
  parentDataset: Dataset;
  protected entityForm: EntityFormComponent;
  minimumRecommendedRecordsize: DatasetRecordSize = '128K' as DatasetRecordSize;
  protected recordsizeField: FormSelectConfig;
  protected recordsizeControl: FormControl;
  protected dedupValue: string;
  protected dedupControl: FormControl;
  protected dedupField: FieldConfig;
  protected isParentEncrypted = false;
  protected isEncryptionInherited = true;
  protected wasWarnedAboutNonEncrypted = false;
  protected encryptionType: 'key' | 'passphrase' = 'key';
  protected generateKey = true;
  namesInUse: string[] = [];
  nameIsCaseInsensitive = false;
  productType: ProductType;

  humanReadable: { [key in SizeField]: string } = {
    quota: '', refquota: '', reservation: '', refreservation: '', special_small_block_size: '',
  };

  private minquota = 1024 * 1024 * 1024; // 1G minimum
  private minrefquota = 1024 * 1024 * 1024;

  parent: string;
  protected parentHasPassphrase = false;

  protected sizeFields: SizeField[] = [
    'quota', 'refquota', 'reservation', 'refreservation', 'special_small_block_size',
  ];
  protected originalSize: { [field in SizeField]?: string } = {};
  protected originalHumanSize: { [field in SizeField]?: string | number } = {};

  protected warning = 80;
  protected critical = 95;
  private dataset: Dataset;

  private wasDedupChecksumWarningShown = false;

  customActions = [
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
          name: 'parent',
          placeholder: helptext.dataset_parent_name_placeholder,
          tooltip: helptext.dataset_parent_name_tooltip,
          readonly: true,
          disabled: true,
        },
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
            { label: 'Standard', value: DatasetSync.Standard },
            { label: 'Always', value: DatasetSync.Always },
            { label: 'Disabled', value: DatasetSync.Disabled },
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
            { label: 'on', value: OnOff.On },
            { label: 'off', value: OnOff.Off },
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
              const config = this.fieldConfig.find((config) => config.name === 'refquota');

              const size = this.convertHumanStringToNum(control.value, 'refquota');
              const errors = control.value && Number.isNaN(size)
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                const sizeError = control.value && (size !== 0) && (size < this.minrefquota)
                  ? { invalid_size: true }
                  : null;

                if (sizeError) {
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
              const config = this.fieldConfig.find((config) => config.name === 'refreservation');

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
              const config = this.fieldConfig.find((config) => config.name === 'quota');

              const size = this.convertHumanStringToNum(control.value, 'quota');
              const errors = control.value && Number.isNaN(size)
                ? { invalid_byte_string: true }
                : null;

              if (errors) {
                config.hasErrors = true;
                config.errors = globalHelptext.human_readable.input_error;
              } else {
                const sizeError = control.value && (size !== 0) && (size < this.minquota)
                  ? { invalid_size: true }
                  : null;

                if (sizeError) {
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
              const config = this.fieldConfig.find((config) => config.name === 'reservation');

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
          name: 'checksum',
          placeholder: this.translate.instant('Checksum'),
          options: [],
        },
        {
          type: 'select',
          name: 'readonly',
          placeholder: helptext.dataset_form_readonly_placeholder,
          tooltip: helptext.dataset_form_readonly_tooltip,
          options: [
            { label: 'On', value: OnOff.On },
            { label: 'Off', value: OnOff.Off },
          ],
        },
        {
          type: 'select',
          name: 'exec',
          placeholder: helptext.dataset_form_exec_placeholder,
          tooltip: helptext.dataset_form_exec_tooltip,
          options: [
            { label: 'On', value: OnOff.On },
            { label: 'Off', value: OnOff.Off },
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
          name: 'snapdev',
          placeholder: 'Snapdev',
          tooltip: this.translate.instant('Controls whether the volume snapshot devices under /dev/zvol/⟨pool⟩ \
 are hidden or visible. The default value is hidden.'),
          options: [
            { label: this.translate.instant('Visible'), value: DatasetSnapdev.Visible },
            { label: this.translate.instant('Hidden'), value: DatasetSnapdev.Hidden },
          ],
          value: DatasetSnapdev.Hidden,
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
          options: [],
        },
        {
          type: 'select',
          name: 'acltype',
          placeholder: this.translate.instant('ACL Type'),
          options: [
            { label: this.translate.instant('Inherit'), value: DatasetAclType.Inherit },
            { label: this.translate.instant('Off'), value: DatasetAclType.Off },
            { label: this.translate.instant('SMB/NFSv4'), value: DatasetAclType.Nfsv4 },
            { label: this.translate.instant('POSIX'), value: DatasetAclType.Posix },
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
            this.dialogService.warn('ACL Types & ACL Modes', helptext.acl_type_change_warning);
          },
        },
        {
          type: 'select',
          name: 'aclmode',
          placeholder: helptext.dataset_form_aclmode_placeholder,
          tooltip: helptext.dataset_form_aclmode_tooltip,
          options: [
            { label: this.translate.instant('Inherit'), value: AclMode.Inherit },
            { label: this.translate.instant('Passthrough'), value: AclMode.Passthrough },
            { label: this.translate.instant('Restricted'), value: AclMode.Restricted },
            { label: this.translate.instant('Discard'), value: AclMode.Discard },
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
            { label: 'Sensitive', value: DatasetCaseSensitivity.Sensitive },
            { label: 'Insensitive', value: DatasetCaseSensitivity.Insensitive },
            { label: 'Mixed', value: DatasetCaseSensitivity.Mixed },
          ],
          value: DatasetCaseSensitivity.Sensitive,
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
              const config = this.fieldConfig.find((config) => config.name === 'special_small_block_size');

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
          options: [
            { label: 'Generic', value: DatasetShareType.Generic },
            { label: 'SMB', value: DatasetShareType.Smb },
          ],
          value: DatasetShareType.Generic,
          disabled: true,
          isHidden: true,
        }],
    },
    { name: 'divider', divider: true },
  ];

  advancedFields = [
    'refquota',
    'quota',
    'quota_unit',
    'refreservation',
    'reservation',
    'readonly',
    'snapdev',
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
    'checksum',
    'acltype',
    'aclmode',
  ];

  encryptionFields = [
    'encryption_type',
    'generate_key',
    'algorithm',
  ];

  addOnlyFields = [
    'refquota',
    'refquota_warning',
    'refquota_warning_inherit',
    'refquota_critical',
    'refquota_critical_inherit',
    'refreservation',
    'quota',
    'quota_warning',
    'quota_warning_inherit',
    'quota_critical',
    'quota_critical_inherit',
    'reservation',
  ];

  keyFields = [
    'key',
  ];

  passphraseFields = [
    'passphrase',
    'confirm_passphrase',
    'pbkdf2iters',
  ];

  setBasicMode(isBasicMode: boolean): void {
    this.isBasicMode = isBasicMode;
    _.find(this.fieldSets, { class: 'dataset' }).label = !isBasicMode;
    _.find(this.fieldSets, { class: 'refdataset' }).label = !isBasicMode;
    _.find(this.fieldSets, { name: 'quota_divider' }).divider = !isBasicMode;
  }

  convertHumanStringToNum(hstr: string | number, field: SizeField): number {
    let num: number | string = 0;
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
    const matches = hstr.match(/^(\d+(\.\d+)?)/);
    if (matches) {
      num = matches[1];
    } else {
      // leading number is required
      this.humanReadable[field] = '';
      return NaN;
    }

    // get optional unit
    unit = hstr.replace(num, '');
    const normalizedUnit = this.storageService.normalizeUnit(unit);
    if (unit && !normalizedUnit) {
      // error when unit is present but not recognized
      this.humanReadable[field] = '';
      return NaN;
    }

    unit = normalizedUnit;
    const spacer = (unit) ? ' ' : '';

    this.humanReadable[field] = num.toString() + spacer + unit;
    return Number(num) * this.storageService.convertUnitToNum(unit);
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
    this.sizeFields.forEach((field) => {
      if (this.originalHumanSize[field] !== data[field]) {
        data[field] = Math.round(this.convertHumanStringToNum(data[field], field));
      } else if (data[field] === null) {
        delete data[field];
      } else {
        data[field] = this.originalSize[field];
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

  isCustomActionVisible(actionId: string): boolean {
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
    protected translate: TranslateService,
    protected formatter: IxFormatterService,
    private store$: Store<AppState>,
    private systemGeneralService: SystemGeneralService,
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
    if (!this.parent) {
      this.entityForm.setDisabled('acltype', true, false);
      this.entityForm.setDisabled('aclmode', true, false);
    }
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.productType = this.systemGeneralService.getProductType();
    const aclControl = entityForm.formGroup.get('aclmode');
    this.entityForm = entityForm;
    if (this.productType === ProductType.ScaleEnterprise) {
      this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((systemInfo) => {
        if (systemInfo.license && systemInfo.license.features.includes(LicenseFeature.Dedup)) {
          this.entityForm.setDisabled('deduplication', false, false);
        }
      });
    } else {
      this.entityForm.setDisabled('deduplication', false, false);
    }

    this.dedupControl = this.entityForm.formGroup.controls['deduplication'] as FormControl;
    this.dedupField = _.find(this.fieldConfig, { name: 'deduplication' });
    this.dedupValue = this.dedupControl.value;
    this.dedupControl.valueChanges.pipe(untilDestroyed(this)).subscribe((dedup: DeduplicationSetting) => {
      if (dedup === DeduplicationSetting.Inherit || dedup === DeduplicationSetting.Off || !dedup) {
        this.dedupField.warnings = '';
      } else {
        this.dedupField.warnings = helptext.dataset_form_deduplication_warning;

        const checksum = this.entityForm.formGroup.get('checksum').value;

        if (this.wasDedupChecksumWarningShown || !checksum || checksum === DatasetChecksum.Sha512) {
          return;
        }

        this.showDedupChecksumWarning();
        this.entityForm.formGroup.get('checksum').setValue(DatasetChecksum.Sha512);
      }
    });

    if (!this.parent) {
      _.find(this.fieldConfig, { name: 'quota_warning_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'quota_critical_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'refquota_warning_inherit' }).placeholder = helptext.dataset_form_default;
      _.find(this.fieldConfig, { name: 'refquota_critical_inherit' }).placeholder = helptext.dataset_form_default;
    }
    if (!entityForm.isNew) {
      _.find(this.fieldConfig, { name: 'parent' }).isHidden = true;
      entityForm.setDisabled('casesensitivity', true);
      entityForm.setDisabled('name', true);
      _.find(this.fieldConfig, { name: 'name' }).tooltip = helptext.dataset_form_name_readonly_tooltip;
      this.encryptionFields.forEach((field) => {
        this.entityForm.setDisabled(field, true, true);
      });
      _.find(this.fieldSets, { name: 'encryption_divider' }).divider = false;
      this.entityForm.setDisabled('encryption', true, true);
      this.entityForm.setDisabled('inherit_encryption', true, true);
    } else {
      entityForm.setDisabled('share_type', false, false);
      entityForm.setDisabled('encryption', this.isEncryptionInherited, this.isEncryptionInherited);
    }

    entityForm.formGroup.get('share_type').valueChanges.pipe(
      filter((shareType) => !!shareType && entityForm.isNew),
      untilDestroyed(this),
    ).subscribe((shareType) => {
      const caseControl = entityForm.formGroup.get('casesensitivity');
      if (shareType === 'SMB') {
        aclControl.setValue(AclMode.Restricted);
        caseControl.setValue(DatasetCaseSensitivity.Insensitive);
        aclControl.disable();
        caseControl.disable();
      } else {
        aclControl.setValue(AclMode.Passthrough);
        caseControl.setValue(DatasetCaseSensitivity.Sensitive);
        aclControl.enable();
        caseControl.enable();
      }
      aclControl.updateValueAndValidity();
      caseControl.updateValueAndValidity();
    });

    this.recordsizeControl = this.entityForm.formGroup.controls['recordsize'] as FormControl;
    this.recordsizeField = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;

    this.ws.call('pool.dataset.recordsize_choices')
      .pipe(
        singleArrayToOptions(),
        untilDestroyed(this),
      )
      .subscribe({
        next: (options) => {
          this.recordsizeField.options = options;
        },
        error: this.handleError,
      });

    this.recordsizeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((recordSize: DatasetRecordSize) => {
      const currentSize = this.formatter.convertHumanStringToNum(recordSize);
      const minimumRecommendedSize = this.formatter.convertHumanStringToNum(this.minimumRecommendedRecordsize);
      if (!currentSize || !minimumRecommendedSize || currentSize >= minimumRecommendedSize) {
        this.recordsizeField.warnings = null;
        return;
      }

      this.recordsizeField.warnings = this.translate.instant(
        helptext.dataset_form_warning,
        { size: this.minimumRecommendedRecordsize },
      );
      this.isBasicMode = false;
    });
    this.setBasicMode(this.isBasicMode);

    if (!this.isNew) {
      // Use separate form when editing
      this.addOnlyFields.forEach((field) => {
        this.entityForm.setDisabled(field, true, true);
      });
    } else {
      // If relation is specified in fieldSet, it prevents fields from being hidden.
      const refquotaWarningInherit = this.entityForm.formGroup.controls['refquota_warning_inherit'];
      refquotaWarningInherit.valueChanges.pipe(untilDestroyed(this)).subscribe((isChecked) => {
        this.entityForm.setDisabled('refquota_warning', isChecked);
      });
      this.entityForm.setDisabled('refquota_warning', refquotaWarningInherit.value);

      const refquotaCritical = this.entityForm.formGroup.controls['refquota_critical_inherit'];
      refquotaCritical.valueChanges.pipe(untilDestroyed(this)).subscribe((isChecked) => {
        this.entityForm.setDisabled('refquota_critical', isChecked);
      });
      this.entityForm.setDisabled('refquota_critical', refquotaCritical.value);

      const quotaWarning = this.entityForm.formGroup.controls['quota_warning_inherit'];
      quotaWarning.valueChanges.pipe(untilDestroyed(this)).subscribe((isChecked) => {
        this.entityForm.setDisabled('quota_warning', isChecked);
      });
      this.entityForm.setDisabled('quota_warning', quotaWarning.value);

      const quotaCritical = this.entityForm.formGroup.controls['quota_critical_inherit'];
      this.entityForm.formGroup.controls['quota_critical_inherit'].valueChanges.pipe(untilDestroyed(this)).subscribe((isChecked) => {
        this.entityForm.setDisabled('quota_critical', isChecked);
      });
      this.entityForm.setDisabled('quota_critical', quotaCritical.value);
    }
  }

  handleError = (error: WebsocketError | Job): void => {
    new EntityUtils().handleWsError(this.entityForm, error, this.dialogService);
  };

  paramMap: {
    volid?: string;
    pk?: string;
    parent?: string;
  };

  preInit(entityForm: EntityFormComponent): void {
    this.volid = this.paramMap['volid'];

    if (this.paramMap['pk'] !== undefined) {
      this.pk = this.paramMap['pk'];

      const pkParent = this.paramMap['pk'].split('/');
      this.parent = pkParent.splice(0, pkParent.length - 1).join('/');
      this.customFilter = [[['id', '=', this.pk]]];
    }
    // add new dataset
    if (this.paramMap['parent'] || this.paramMap['pk'] === undefined) {
      this.parent = this.paramMap['parent'];
      this.pk = this.parent;
      this.isNew = true;
      entityForm.formGroup.controls['parent'].setValue(this.parent);
      this.fieldSets[0].config[1].readonly = false;
      _.find(this.fieldSets, { class: 'dataset' }).label = false;
      _.find(this.fieldSets, { class: 'refdataset' }).label = false;
    }
    this.ws.call('pool.dataset.compression_choices').pipe(untilDestroyed(this)).subscribe({
      next: (choices) => {
        const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
        for (const key in choices) {
          compression.options.push({ label: key, value: choices[key] });
        }
      },
      error: this.handleError,
    });

    this.ws.call('pool.dataset.checksum_choices').pipe(untilDestroyed(this)).subscribe({
      next: (checksumChoices) => {
        const checksumFieldConfig = _.find(this.fieldConfig, { name: 'checksum' }) as FormSelectConfig;
        for (const key in checksumChoices) {
          checksumFieldConfig.options.push({ label: key, value: checksumChoices[key] });
        }
      },
      error: this.handleError,
    });

    if (this.parent) {
      const root = this.parent.split('/')[0];
      this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(untilDestroyed(this)).subscribe({
        next: (recommendedSize) => {
          this.minimumRecommendedRecordsize = recommendedSize;
        },
        error: this.handleError,
      });

      this.ws.call('pool.dataset.query', [[['id', '=', this.pk]]]).pipe(untilDestroyed(this)).subscribe({
        next: (pkDataset) => {
          this.isParentEncrypted = pkDataset[0].encrypted;
          let inheritEncryptPlaceholder: string = helptext.dataset_form_encryption.inherit_checkbox_notencrypted;
          if (this.isParentEncrypted) {
            if (pkDataset[0].key_format.value === DatasetEncryptionType.Passphrase) {
              this.parentHasPassphrase = true;
              // if parent is passphrase this dataset cannot be a key type
              this.encryptionType = 'passphrase';
              _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
            }
            inheritEncryptPlaceholder = helptext.dataset_form_encryption.inherit_checkbox_encrypted;
          }
          _.find(this.fieldConfig, { name: 'inherit_encryption' }).placeholder = inheritEncryptPlaceholder;
          const children = (pkDataset[0].children);
          if (pkDataset[0].casesensitivity.value === DatasetCaseSensitivity.Sensitive) {
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
            const encryptionAlgorithmConfig = _.find(this.fieldConfig, { name: 'algorithm' }) as FormSelectConfig;
            const encryptionAlgorithmControl = this.entityForm.formGroup.controls['algorithm'];
            let parentAlgorithm;
            if (this.isParentEncrypted && pkDataset[0].encryption_algorithm) {
              parentAlgorithm = pkDataset[0].encryption_algorithm.value;
              encryptionAlgorithmControl.setValue(parentAlgorithm);
            }
            this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(untilDestroyed(this)).subscribe({
              next: (algorithms) => {
                encryptionAlgorithmConfig.options = [];
                for (const algorithm in algorithms) {
                  if (algorithms.hasOwnProperty(algorithm)) {
                    encryptionAlgorithmConfig.options.push({ label: algorithm, value: algorithm });
                  }
                }
              },
              error: this.handleError,
            });
            const inheritEncryptionControl = this.entityForm.formGroup.controls['inherit_encryption'];
            const encryptionControl = this.entityForm.formGroup.controls['encryption'];
            const encryptionTypeControl = this.entityForm.formGroup.controls['encryption_type'];
            const allEncryptionFields = this.encryptionFields.concat(this.keyFields, this.passphraseFields);
            if (this.parentHasPassphrase) {
              encryptionTypeControl.setValue('passphrase');
            }
            this.encryptionFields.forEach((field) => {
              this.entityForm.setDisabled(field, true, true);
            });
            inheritEncryptionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((inherit: boolean) => {
              this.isEncryptionInherited = inherit;
              if (inherit) {
                allEncryptionFields.forEach((field) => {
                  this.entityForm.setDisabled(field, true, true);
                });
                this.entityForm.setDisabled('encryption', true, true);
              }
              if (!inherit) {
                this.entityForm.setDisabled('encryption_type', false, false);
                this.entityForm.setDisabled('algorithm', false, false);
                if (this.parentHasPassphrase) { // keep it hidden if it passphrase
                  _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
                }
                const isKeyEncryptionType = (this.encryptionType === 'key');
                this.entityForm.setDisabled('passphrase', isKeyEncryptionType, isKeyEncryptionType);
                this.entityForm.setDisabled('confirm_passphrase', isKeyEncryptionType, isKeyEncryptionType);
                this.entityForm.setDisabled('pbkdf2iters', isKeyEncryptionType, isKeyEncryptionType);
                this.entityForm.setDisabled('generate_key', !isKeyEncryptionType, !isKeyEncryptionType);
                this.entityForm.setDisabled('encryption', false, false);
              }
            });
            encryptionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((encryption: boolean) => {
              // if on an encrypted parent we should warn the user, otherwise just disable the fields
              if (this.isParentEncrypted && !encryption && !this.wasWarnedAboutNonEncrypted) {
                this.dialogService.confirm({
                  title: helptext.dataset_form_encryption.non_encrypted_warning_title,
                  message: helptext.dataset_form_encryption.non_encrypted_warning_warning,
                }).pipe(
                  filter(Boolean),
                  untilDestroyed(this),
                ).subscribe(() => {
                  this.wasWarnedAboutNonEncrypted = true;
                  allEncryptionFields.forEach((field) => {
                    if (field !== 'encryption') {
                      this.entityForm.setDisabled(field, true, true);
                    }
                  });
                });
              } else {
                this.encryptionFields.forEach((field) => {
                  if (field !== 'encryption') {
                    if (field === 'generate_key' && this.encryptionType !== 'key') {
                      return;
                    }

                    this.entityForm.setDisabled(field, !encryption, !encryption);
                  }
                });
                if (this.encryptionType === 'key' && !this.generateKey) {
                  this.entityForm.setDisabled('key', !encryption, !encryption);
                }
                if (this.encryptionType === 'passphrase') {
                  this.passphraseFields.forEach((field) => {
                    this.entityForm.setDisabled(field, !encryption, !encryption);
                  });
                }
                if (this.parentHasPassphrase) { // keep this field hidden if parent has a passphrase
                  _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
                }
              }
            });
            encryptionTypeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((type: 'key' | 'passphrase') => {
              this.encryptionType = type;
              const key = (type === 'key');
              this.entityForm.setDisabled('passphrase', key, key);
              this.entityForm.setDisabled('confirm_passphrase', key, key);
              this.entityForm.setDisabled('pbkdf2iters', key, key);
              this.entityForm.setDisabled('generate_key', !key, !key);
              if (key) {
                this.entityForm.setDisabled('key', this.generateKey, this.generateKey);
              } else {
                this.entityForm.setDisabled('key', true, true);
              }
            });
            this.entityForm.formGroup.controls['generate_key'].valueChanges.pipe(untilDestroyed(this)).subscribe((generateKey: boolean) => {
              this.generateKey = generateKey;
              this.entityForm.setDisabled('key', generateKey, generateKey);
            });

            const sync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
            const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
            const deduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
            const checksum = _.find(this.fieldConfig, { name: 'checksum' }) as FormSelectConfig;
            const exec = _.find(this.fieldConfig, { name: 'exec' }) as FormSelectConfig;
            const readonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
            const atime = _.find(this.fieldConfig, { name: 'atime' }) as FormSelectConfig;
            const recordsize = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;
            const snapdev = _.find(this.fieldConfig, { name: 'snapdev' }) as FormSelectConfig;
            const syncInherit: Option[] = [{ label: `Inherit (${pkDataset[0].sync.rawvalue})`, value: inherit }];
            const compressionInherit: Option[] = [{ label: `Inherit (${pkDataset[0].compression.rawvalue})`, value: inherit }];
            const deduplicationInherit: Option[] = [{ label: `Inherit (${pkDataset[0].deduplication.rawvalue})`, value: inherit }];
            const checksumInherit = [{ label: `Inherit (${pkDataset[0].checksum.rawvalue})`, value: 'INHERIT' }];
            const execInherit: Option[] = [{ label: `Inherit (${pkDataset[0].exec.rawvalue})`, value: inherit }];
            const readonlyInherit: Option[] = [{ label: `Inherit (${pkDataset[0].readonly.rawvalue})`, value: inherit }];
            const atimeInherit: Option[] = [{ label: `Inherit (${pkDataset[0].atime.rawvalue})`, value: inherit }];
            const snapdevInherit: Option[] = [{ label: `Inherit (${pkDataset[0].snapdev.rawvalue})`, value: inherit }];

            this.storageService.convertHumanStringToNum(pkDataset[0].recordsize.value);
            const recordsizeInherit: Option[] = [{ label: `Inherit (${this.storageService.humanReadable})`, value: inherit }];
            if (pkDataset[0].refquota_critical && pkDataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['refquota_critical'].setValue(pkDataset[0].refquota_critical.value);
            }
            if (pkDataset[0].refquota_warning && pkDataset[0].refquota_warning.value) {
              entityForm.formGroup.controls['refquota_warning'].setValue(pkDataset[0].refquota_warning.value);
            }
            if (pkDataset[0].refquota_critical && pkDataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['quota_critical'].setValue(pkDataset[0].quota_critical.value);
            }
            if (pkDataset[0].refquota_critical && pkDataset[0].refquota_critical.value) {
              entityForm.formGroup.controls['quota_warning'].setValue(pkDataset[0].quota_warning.value);
            }

            sync.options = syncInherit.concat(sync.options);
            compression.options = compressionInherit.concat(compression.options);
            deduplication.options = deduplicationInherit.concat(deduplication.options);
            checksum.options = checksumInherit.concat(checksum.options);
            exec.options = execInherit.concat(exec.options);
            readonly.options = readonlyInherit.concat(readonly.options);
            atime.options = atimeInherit.concat(atime.options);
            recordsize.options = recordsizeInherit.concat(recordsize.options);
            snapdev.options = snapdevInherit.concat(snapdev.options);

            entityForm.formGroup.controls['sync'].setValue(inherit);
            entityForm.formGroup.controls['compression'].setValue(inherit);
            entityForm.formGroup.controls['deduplication'].setValue(inherit);
            entityForm.formGroup.controls['checksum'].setValue('INHERIT');
            entityForm.formGroup.controls['exec'].setValue(inherit);
            entityForm.formGroup.controls['readonly'].setValue(inherit);
            entityForm.formGroup.controls['atime'].setValue(inherit);
            entityForm.formGroup.controls['recordsize'].setValue(inherit);
            entityForm.formGroup.controls['snapdev'].setValue(inherit);
          } else {
            this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).pipe(untilDestroyed(this)).subscribe({
              next: (parentDataset) => {
                this.parentDataset = parentDataset[0];
                const currentDataset = _.find(this.parentDataset.children, { name: this.pk });
                if (currentDataset.hasOwnProperty('recordsize') && currentDataset['recordsize'].value) {
                  const config = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;
                  _.find(config.options, { value: currentDataset['recordsize'].value })['hiddenFromDisplay'] = false;
                }
                const editSync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
                const editCompression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
                const editDeduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
                const editExec = _.find(this.fieldConfig, { name: 'exec' }) as FormSelectConfig;
                const editReadonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
                const editAtime = _.find(this.fieldConfig, { name: 'atime' }) as FormSelectConfig;
                const editRecordsize = _.find(this.fieldConfig, { name: 'recordsize' }) as FormSelectConfig;
                const editChecksum = _.find(this.fieldConfig, { name: 'checksum' }) as FormSelectConfig;
                const editSnapdev = _.find(this.fieldConfig, { name: 'snapdev' }) as FormSelectConfig;

                const editSyncCollection: Option[] = [{ label: `Inherit (${this.parentDataset.sync.rawvalue})`, value: inherit }];
                editSync.options = editSyncCollection.concat(editSync.options);

                const editCompressionCollection: Option[] = [{ label: `Inherit (${this.parentDataset.compression.rawvalue})`, value: inherit }];
                editCompression.options = editCompressionCollection.concat(editCompression.options);

                const editDeduplicationCollection: Option[] = [{ label: `Inherit (${this.parentDataset.deduplication.rawvalue})`, value: inherit }];
                editDeduplication.options = editDeduplicationCollection.concat(editDeduplication.options);

                const editExecCollection: Option[] = [{ label: `Inherit (${this.parentDataset.exec.rawvalue})`, value: inherit }];
                editExec.options = editExecCollection.concat(editExec.options);

                const editChecksumCollection = [{ label: `Inherit (${this.parentDataset.deduplication.rawvalue})`, value: 'INHERIT' }];
                editChecksum.options = editChecksumCollection.concat(editChecksum.options);

                const editReadonlyCollection: Option[] = [{ label: `Inherit (${this.parentDataset.readonly.rawvalue})`, value: inherit }];
                editReadonly.options = editReadonlyCollection.concat(editReadonly.options);

                const editAtimeCollection: Option[] = [{ label: `Inherit (${this.parentDataset.atime.rawvalue})`, value: inherit }];
                editAtime.options = editAtimeCollection.concat(editAtime.options);

                const editSnapdevCollection: Option[] = [{ label: `Inherit (${this.parentDataset.snapdev.rawvalue})`, value: inherit }];
                editSnapdev.options = editSnapdevCollection.concat(editSnapdev.options);

                const lastChar = this.parentDataset.recordsize.value[this.parentDataset.recordsize.value.length - 1];
                const formattedLabel = lastChar === 'K' || lastChar === 'M'
                  ? `${this.parentDataset.recordsize.value.slice(0, -1)} ${lastChar}iB`
                  : this.parentDataset.recordsize.value;
                const editRecordsizeCollection: Option[] = [{ label: `Inherit (${formattedLabel})`, value: inherit }];
                editRecordsize.options = editRecordsizeCollection.concat(editRecordsize.options);
                let syncValue = pkDataset[0].sync.value;
                if (pkDataset[0].sync.source === ZfsPropertySource.Default) {
                  syncValue = inherit;
                }
                entityForm.formGroup.controls['sync'].setValue(syncValue);

                let compressionValue = pkDataset[0].compression.value;
                if ([
                  ZfsPropertySource.Inherited,
                  ZfsPropertySource.Default,
                ].includes(pkDataset[0].compression.source)) {
                  compressionValue = inherit;
                }
                entityForm.formGroup.controls['compression'].setValue(compressionValue);

                let deduplicationValue = pkDataset[0].deduplication.value;
                if (
                  [ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pkDataset[0].deduplication.source)
                ) {
                  deduplicationValue = inherit;
                }
                let checksumValue = pkDataset[0].checksum.value;
                if (pkDataset[0].checksum.source === 'DEFAULT' || pkDataset[0].checksum.source === 'INHERITED') {
                  checksumValue = 'INHERIT';
                }
                let execValue = pkDataset[0].exec.value;
                if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pkDataset[0].exec.source)) {
                  execValue = inherit;
                }
                let readonlyValue = pkDataset[0].readonly.value;
                if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pkDataset[0].readonly.source)) {
                  readonlyValue = inherit;
                }
                let atimeValue = pkDataset[0].atime.value;
                if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pkDataset[0].atime.source)) {
                  atimeValue = inherit;
                }
                let recordsizeValue = pkDataset[0].recordsize.value;
                if ([
                  ZfsPropertySource.Inherited,
                  ZfsPropertySource.Default,
                ].includes(pkDataset[0].recordsize.source)) {
                  recordsizeValue = inherit;
                }
                let snapdevValue = pkDataset[0].snapdev.value;
                if ([ZfsPropertySource.Inherited, ZfsPropertySource.Default].includes(pkDataset[0].snapdev.source)) {
                  snapdevValue = inherit;
                }

                entityForm.formGroup.controls['deduplication'].setValue(deduplicationValue);
                entityForm.formGroup.controls['exec'].setValue(execValue);
                entityForm.formGroup.controls['checksum'].setValue(checksumValue);
                entityForm.formGroup.controls['readonly'].setValue(readonlyValue);
                entityForm.formGroup.controls['atime'].setValue(atimeValue);
                entityForm.formGroup.controls['recordsize'].setValue(recordsizeValue);
                entityForm.formGroup.controls['snapdev'].setValue(snapdevValue);
                this.parentDataset = parentDataset[0];
              },
              error: this.handleError,
            });
          }
        },
        error: this.handleError,
      });
    }
  }

  getFieldValueOrRaw(field: ZfsProperty<unknown>): any {
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
    if (
      !value
      || !field.source
      || field.source === ZfsPropertySource.Inherited
      || field.source === ZfsPropertySource.Default
    ) {
      return true;
    }
    return false;
  }

  resourceTransformIncomingRestData(wsResponse: Dataset): DatasetFormData {
    this.dataset = wsResponse;
    if (wsResponse.special_small_block_size && wsResponse.special_small_block_size.rawvalue === '0') {
      delete wsResponse.special_small_block_size;
    }
    const quotaWarning = this.getFieldValueOrNone(wsResponse.quota_warning)
      ? this.getFieldValueOrNone(wsResponse.quota_warning)
      : this.warning;
    const quotaWarningInherit = this.isInherited(wsResponse.quota_warning, quotaWarning);
    const quotaCritical = this.getFieldValueOrNone(wsResponse.quota_critical)
      ? this.getFieldValueOrNone(wsResponse.quota_critical)
      : this.critical;
    const quotaCriticalInherit = this.isInherited(wsResponse.quota_critical, quotaCritical);
    const refquotaWarning = this.getFieldValueOrNone(wsResponse.refquota_warning)
      ? this.getFieldValueOrNone(wsResponse.refquota_warning)
      : this.warning;
    const refquotaWarningInherit = this.isInherited(wsResponse.refquota_warning, refquotaWarning);
    const refquotaCritical = this.getFieldValueOrNone(wsResponse.refquota_critical)
      ? this.getFieldValueOrNone(wsResponse.refquota_critical)
      : this.critical;
    const refquotaCriticalInherit = this.isInherited(wsResponse.refquota_critical, refquotaCritical);
    const sizeValues: { [field in SizeField]?: string | number } = {};
    this.sizeFields.forEach((field) => {
      if (wsResponse[field] && wsResponse[field].rawvalue) {
        this.originalSize[field] = wsResponse[field].rawvalue;
      }
      sizeValues[field] = this.getFieldValueOrRaw(wsResponse[field]);
      this.convertHumanStringToNum(sizeValues[field], field);
      this.originalHumanSize[field] = this.humanReadable[field];
    });

    const returnValue: DatasetFormData = {
      name: wsResponse.name,
      atime: this.getFieldValueOrRaw(wsResponse.atime),
      share_type: this.getFieldValueOrRaw(wsResponse.share_type),
      acltype: this.getFieldValueOrRaw(wsResponse.acltype),
      aclmode: this.getFieldValueOrRaw(wsResponse.aclmode),
      casesensitivity: this.getFieldValueOrRaw(wsResponse.casesensitivity),
      comments: wsResponse.comments?.source === ZfsPropertySource.Local
        ? wsResponse.comments.value
        : undefined,
      compression: this.getFieldValueOrRaw(wsResponse.compression),
      copies: this.getFieldValueOrRaw(wsResponse.copies),
      deduplication: this.getFieldValueOrRaw(wsResponse.deduplication),
      checksum: this.getFieldValueOrRaw(wsResponse.checksum),
      quota_warning: quotaWarning,
      quota_warning_inherit: quotaWarningInherit,
      quota_critical: quotaCritical,
      quota_critical_inherit: quotaCriticalInherit,
      refquota_warning: refquotaWarning,
      refquota_warning_inherit: refquotaWarningInherit,
      refquota_critical: refquotaCritical,
      refquota_critical_inherit: refquotaCriticalInherit,
      quota: this.originalHumanSize['quota'] as number,
      readonly: this.getFieldValueOrRaw(wsResponse.readonly),
      exec: this.getFieldValueOrRaw(wsResponse.exec),
      recordsize: this.getFieldValueOrRaw(wsResponse.recordsize),
      refquota: this.originalHumanSize['refquota'] as number,
      refreservation: this.originalHumanSize['refreservation'] as number,
      reservation: this.originalHumanSize['reservation'] as number,
      snapdev: this.getFieldValueOrRaw(wsResponse.snapdev),
      snapdir: this.getFieldValueOrRaw(wsResponse.snapdir),
      sync: this.getFieldValueOrRaw(wsResponse.sync),
      special_small_block_size: this.originalHumanSize['special_small_block_size'] as number,
    };

    if (
      sizeValues['quota']
      || sizeValues['refquota']
      || sizeValues['refreservation']
      || sizeValues['reservation']
      || sizeValues['special_small_block_size']
      || !quotaWarningInherit
      || !quotaCriticalInherit
      || !refquotaWarningInherit
      || !refquotaCriticalInherit
      || quotaWarning !== this.warning
      || quotaCritical !== this.critical
      || refquotaCritical !== this.critical
      || refquotaWarning !== this.warning
    ) {
      this.isBasicMode = false;
    }

    return returnValue;
  }

  beforeSubmit(data: { parent: unknown }): void {
    delete data.parent;
  }

  // TODO: Similar to addSubmit.
  editSubmit(body: any): Observable<Dataset> {
    const data = this.sendAsBasicOrAdvanced(body);
    if (data['special_small_block_size'] === 0) {
      delete data.special_small_block_size;
    }

    delete (data.quota_warning_inherit);
    delete (data.quota_critical_inherit);
    delete (data.refquota_warning_inherit);
    delete (data.refquota_critical_inherit);

    if (data.acltype === DatasetAclType.Posix || data.acltype === DatasetAclType.Off) {
      data.aclmode = AclMode.Discard;
    } else if (data.acltype === DatasetAclType.Inherit) {
      data.aclmode = AclMode.Inherit;
    }
    return this.ws.call('pool.dataset.update', [this.pk, data]);
  }

  addSubmit(body: any): Observable<Dataset> {
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

    if (data.recordsize === inherit) {
      delete (data.recordsize);
    }
    if (data.sync === inherit) {
      delete (data.sync);
    }
    if (data.compression === inherit) {
      delete (data.compression);
    }
    if (data.atime === inherit) {
      delete (data.atime);
    }
    if (data.exec === inherit) {
      delete (data.exec);
    }
    if (data.readonly === inherit) {
      delete (data.readonly);
    }
    if (data.deduplication === inherit) {
      delete (data.deduplication);
    }
    if (data.checksum === 'INHERIT') {
      delete data.checksum;
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
    return operation$.pipe(untilDestroyed(this)).subscribe({
      next: (restPostResp) => {
        this.loader.close();
        this.modalService.closeSlideIn();
        const parentPath = `/mnt/${this.parent}`;
        this.ws.call('filesystem.acl_is_trivial', [parentPath]).pipe(untilDestroyed(this)).subscribe({
          next: (isTrivial) => {
            if (!isTrivial) {
              this.dialogService.confirm({
                title: helptext.afterSubmitDialog.title,
                message: helptext.afterSubmitDialog.message,
                hideCheckBox: true,
                buttonMsg: helptext.afterSubmitDialog.actionBtn,
                cancelMsg: helptext.afterSubmitDialog.cancelBtn,
              }).pipe(untilDestroyed(this)).subscribe((confirmed) => {
                if (confirmed) {
                  this.ws.call('filesystem.getacl', [parentPath]).pipe(untilDestroyed(this)).subscribe({
                    next: ({ acltype }) => {
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
                    },
                    error: this.handleError,
                  });
                } else {
                  this.modalService.closeSlideIn();
                }
              });
            } else {
              this.modalService.closeSlideIn();
            }
            this.modalService.refreshTable();
          },
          error: this.handleError,
        });
      },
      error: (error) => {
        this.loader.close();
        this.handleError(error);
      },
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
    this.title = this.translate.instant(title);
  }

  private showDedupChecksumWarning(): void {
    this.wasDedupChecksumWarningShown = true;
    this.dialogService.confirm({
      hideCancel: true,
      title: this.translate.instant('Default Checksum Warning'),
      hideCheckBox: true,
      message: this.translate.instant(`The default "Checksum" value for datasets with deduplication used to be SHA256.
       Our testing has shown that SHA512 performs better for such datasets.
       We've changed the checksum value from SHA256 to SHA512. You can change it back in "Advanced Options".`),
      buttonMsg: this.translate.instant('OK'),
    });
  }
}
