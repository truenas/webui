import { Component } from '@angular/core';
import { Validators, ValidationErrors, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DatasetEncryptionType } from 'app/enums/dataset-encryption-type.enum';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/zvol-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormCheckboxConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

interface ZvolFormData {
  name: string;
  comments: string;
  volsize: number;
  volsize_unit: string;
  force_size: boolean;
  sync: string;
  compression: string;
  deduplication: string;
  sparse: boolean;
  volblocksize: string;
  type: string;
}

@UntilDestroy()
@Component({
  selector: 'app-zvol-add',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ZvolFormComponent implements FormConfiguration {
  pk: string;
  protected path: string;
  advanced_field = ['volblocksize'];
  isBasicMode = true;
  isNew = true;
  isEntity = true;
  parent: string;
  volid: string;
  customFilter: any[] = [];
  edit_data: any;
  protected entityForm: EntityFormComponent;
  minimum_recommended_zvol_volblocksize: string;
  namesInUse: string[] = [];
  title: string;

  protected origVolSize: number;
  protected origHuman: any;

  protected non_encrypted_warned = false;
  protected encrypted_parent = false;
  protected inherit_encryption = true;
  protected passphrase_parent = false;
  protected encryption_type: 'key' | 'passphrase' = 'key';
  protected generate_key = true;
  protected encryption_algorithm: string;

  custActions = [
    {
      id: 'basic_mode',
      name: globalHelptext.basic_options,
      function: () => { this.isBasicMode = !this.isBasicMode; },
    },
    {
      id: 'advanced_mode',
      name: globalHelptext.advanced_options,
      function: () => { this.isBasicMode = !this.isBasicMode; },
    },
  ];

  protected byteMap = {
    T: 1099511627776,
    G: 1073741824,
    M: 1048576,
    K: 1024,
  };
  protected reverseZvolBlockSizeMap = {
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
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [{
    name: 'general',
    class: 'general',
    label: false,
    config: [
      {
        type: 'input',
        name: 'name',
        placeholder: helptext.zvol_name_placeholder,
        tooltip: helptext.zvol_name_tooltip,
        validation: [Validators.required, forbiddenValues(this.namesInUse)],
        required: true,
        isHidden: false,
      },
      {
        type: 'input',
        name: 'comments',
        placeholder: helptext.zvol_comments_placeholder,
        tooltip: helptext.zvol_comments_tooltip,
      },
      {
        type: 'input',
        name: 'volsize',
        placeholder: helptext.zvol_volsize_placeholder,
        tooltip: helptext.zvol_volsize_tooltip,
        required: true,
        blurEvent: () => this.blurVolsize(),
        blurStatus: true,
        parent: this,
        validation: [
          (control: FormControl): ValidationErrors => {
            const config = this.fieldSets[0].config.find((c) => c.name === 'volsize');

            const size = control.value && typeof control.value == 'string' ? this.storageService.convertHumanStringToNum(control.value, true) : null;
            const humanSize = control.value;

            let errors = control.value && isNaN(size)
              ? { invalid_byte_string: true }
              : null;

            if (errors) {
              config.hasErrors = true;
              config.errors = globalHelptext.human_readable.input_error;
            } else if (size === 0) {
              config.hasErrors = true;
              config.errors = helptext.zvol_volsize_zero_error;
              errors = { invalid_byte_string: true };
            } else if ((this.origHuman && humanSize)
                      && (humanSize !== this.origHuman)
                      && (size < this.origVolSize)) {
              config.hasErrors = true;
              config.errors = helptext.zvol_volsize_shrink_error;
              errors = { invalid_byte_string: true };
            } else {
              config.hasErrors = false;
              config.errors = '';
            }

            return errors;
          },
        ],
      },
      {
        type: 'checkbox',
        name: 'force_size',
        placeholder: helptext.zvol_forcesize_placeholder,
        tooltip: helptext.zvol_forcesize_tooltip,
      },
      {
        type: 'select',
        name: 'sync',
        placeholder: helptext.zvol_sync_placeholder,
        tooltip: helptext.zvol_sync_tooltip,
        options: [
          { label: T('Standard'), value: 'STANDARD' },
          { label: T('Always'), value: 'ALWAYS' },
          { label: T('Disabled'), value: 'DISABLED' },
        ],
      },
      {
        type: 'select',
        name: 'compression',
        placeholder: helptext.zvol_compression_placeholder,
        tooltip: helptext.zvol_compression_tooltip,
        options: [
          { label: T('Off'), value: 'OFF' },
          { label: T('lz4 (recommended)'), value: 'LZ4' },
          { label: T('zstd (default level, 3)'), value: 'ZSTD' },
          { label: T('zstd-5 (slow)'), value: 'ZSTD-5' },
          { label: T('zstd-7 (very slow)'), value: 'ZSTD-7' },
          { label: T('zstd-fast (default level, 1)'), value: 'ZSTD-FAST' },
          { label: T('gzip (default level, 6)'), value: 'GZIP' },
          { label: T('gzip-1 (fastest)'), value: 'GZIP-1' },
          { label: T('gzip-9 (maximum, slow)'), value: 'GZIP-9' },
          { label: T('zle (runs of zeros)'), value: 'ZLE' },
          { label: T('lzjb (legacy, not recommended)'), value: 'LZJB' },
        ],
        validation: helptext.zvol_compression_validation,
        required: true,
      },
      {
        type: 'select',
        name: 'deduplication',
        placeholder: helptext.zvol_deduplication_placeholder,
        tooltip: helptext.zvol_deduplication_tooltip,
        options: [
          { label: T('On'), value: DeduplicationSetting.On },
          { label: T('Verify'), value: DeduplicationSetting.Verify },
          { label: T('Off'), value: DeduplicationSetting.Off },
        ],
        validation: helptext.zvol_deduplication_validation,
        required: true,
      },
      {
        type: 'checkbox',
        name: 'sparse',
        placeholder: helptext.zvol_sparse_placeholder,
        tooltip: helptext.zvol_sparse_tooltip,
        isHidden: false,
      },
      {
        type: 'select',
        name: 'readonly',
        placeholder: helptext.zvol_readonly_placeholder,
        tooltip: helptext.zvol_readonly_tooltip,
        options: [
          { label: T('On'), value: 'ON' },
          { label: T('Off'), value: 'OFF' },
        ],
      },
      {
        type: 'select',
        name: 'volblocksize',
        placeholder: helptext.zvol_volblocksize_placeholder,
        tooltip: helptext.zvol_volblocksize_tooltip,
        options: [
          { label: '4 KiB', value: '4K' },
          { label: '8 KiB', value: '8K' },
          { label: '16 KiB', value: '16K' },
          { label: '32 KiB', value: '32K' },
          { label: '64 KiB', value: '64K' },
          { label: '128 KiB', value: '128K' },
        ],
        isHidden: false,
      },
    ],
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
  }];

  encryption_fields = [
    'encryption_type',
    'generate_key',
    'algorithm',
  ];

  passphrase_fields = [
    'passphrase',
    'confirm_passphrase',
    'pbkdf2iters',
  ];

  key_fields = [
    'key',
  ];

  isCustActionVisible(actionId: string): boolean {
    if (actionId === 'advanced_mode' && !this.isBasicMode) {
      return false;
    } if (actionId === 'basic_mode' && this.isBasicMode) {
      return false;
    }
    return true;
  }

  sendAsBasicOrAdvanced(data: ZvolFormData): ZvolFormData {
    data.type = 'VOLUME';

    if (!this.isNew) {
      delete data.name;
      delete data.volblocksize;
      delete data.type;
      delete data.sparse;
    } else {
      data.name = this.parent + '/' + data.name;
    }

    if (this.origHuman !== data.volsize) {
      data.volsize = this.storageService.convertHumanStringToNum(data.volsize, true);
    } else {
      delete data.volsize;
    }
    return data;
  }

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected storageService: StorageService,
    private translate: TranslateService,
    protected modalService: ModalService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    if (!this.parent) return;
    if (!entityForm.isNew) {
      for (let i = 0; i < this.encryption_fields.length; i++) {
        this.entityForm.setDisabled(this.encryption_fields[i], true, true);
      }
      _.find(this.fieldSets, { name: 'encryption_divider' }).divider = false;
      this.entityForm.setDisabled('encryption', true, true);
      this.entityForm.setDisabled('inherit_encryption', true, true);
    }

    if (this.isNew) {
      this.title = helptext.zvol_title_add;
    } else {
      this.title = helptext.zvol_title_edit;
    }

    this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).pipe(untilDestroyed(this)).subscribe((pk_dataset) => {
      this.encrypted_parent = pk_dataset[0].encrypted;
      this.encryption_algorithm = pk_dataset[0].encryption_algorithm.value;
      const children = (pk_dataset[0].children);
      if (children.length > 0) {
        children.forEach((child) => {
          this.namesInUse.push(/[^/]*$/.exec(child.name)[0]);
        });
      }

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

      if (this.isNew) {
        const encryption_algorithm_fc = _.find(this.fieldConfig, { name: 'algorithm' }) as FormSelectConfig;
        const encryption_algorithm_fg = this.entityForm.formGroup.controls['algorithm'];
        let parent_algorithm;
        if (this.encrypted_parent && pk_dataset[0].encryption_algorithm) {
          parent_algorithm = pk_dataset[0].encryption_algorithm.value;
          encryption_algorithm_fg.setValue(parent_algorithm);
        }
        this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(untilDestroyed(this)).subscribe((algorithms) => {
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
        for (let i = 0; i < this.encryption_fields.length; i++) {
          this.entityForm.setDisabled(this.encryption_fields[i], true, true);
        }
        inherit_encryption_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((inherit: boolean) => {
          this.inherit_encryption = inherit;
          if (inherit) {
            for (let i = 0; i < all_encryption_fields.length; i++) {
              this.entityForm.setDisabled(all_encryption_fields[i], inherit, inherit);
            }
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
              for (let i = 0; i < all_encryption_fields.length; i++) {
                if (all_encryption_fields[i] !== 'encryption') {
                  this.entityForm.setDisabled(all_encryption_fields[i], true, true);
                }
              }
            });
          } else {
            for (let i = 0; i < this.encryption_fields.length; i++) {
              if (this.encryption_fields[i] !== 'encryption') {
                if (this.encryption_fields[i] === 'generate_key' && this.encryption_type !== 'key') {
                  continue;
                } else {
                  this.entityForm.setDisabled(this.encryption_fields[i], !encryption, !encryption);
                }
              }
            }
            if (this.encryption_type === 'key' && !this.generate_key) {
              this.entityForm.setDisabled('key', !encryption, !encryption);
            }
            if (this.encryption_type === 'passphrase') {
              for (let i = 0; i < this.passphrase_fields.length; i++) {
                this.entityForm.setDisabled(this.passphrase_fields[i], !encryption, !encryption);
              }
            }
            if (this.passphrase_parent) { // keep this field hidden if parent has a passphrase
              _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
            }
          }
        });
        encryption_type_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((type: 'key' | 'passphrase') => {
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
      } else {
        entityForm.setDisabled('name', true);
      }

      this.entityForm.formGroup.controls['volblocksize'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
        const res_number = parseInt((this.reverseZvolBlockSizeMap as any)[res], 10);
        if (this.minimum_recommended_zvol_volblocksize) {
          const recommended_size_number = parseInt(
            (this.reverseZvolBlockSizeMap as any)[this.minimum_recommended_zvol_volblocksize], 0,
          );
          if (res_number < recommended_size_number) {
            this.translate.get(helptext.blocksize_warning.a).pipe(untilDestroyed(this)).subscribe((blockMsgA) => (
              this.translate.get(helptext.blocksize_warning.b).pipe(untilDestroyed(this)).subscribe((blockMsgB) => {
                _.find(this.fieldConfig, { name: 'volblocksize' }).warnings = `${blockMsgA} ${this.minimum_recommended_zvol_volblocksize}. ${blockMsgB}`;
              })
            ));
          } else {
            _.find(this.fieldConfig, { name: 'volblocksize' }).warnings = null;
          }
        }
      });

      this.translate.get('Inherit').pipe(untilDestroyed(this)).subscribe((inheritTr) => {
        const readonly_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].readonly.rawvalue})`, value: 'INHERIT' }];
        const readonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
        readonly.options = readonly_inherit.concat(readonly.options);
        let readonly_value;
        if (this.isNew) {
          readonly_value = 'INHERIT';
        } else {
          readonly_value = pk_dataset[0].readonly.value;
          if (pk_dataset[0].readonly.source === 'DEFAULT' || pk_dataset[0].readonly.source === 'INHERITED') {
            readonly_value = 'INHERIT';
          }
        }
        entityForm.formGroup.controls['readonly'].setValue(readonly_value);

        const sync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
        const sparse = _.find(this.fieldConfig, { name: 'sparse' }) as FormCheckboxConfig;
        const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
        const deduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
        const volblocksize = _.find(this.fieldConfig, { name: 'volblocksize' }) as FormSelectConfig;

        if (pk_dataset && pk_dataset[0].type === DatasetType.Filesystem) {
          const sync_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT' }];
          sync.options = sync_inherit.concat(sync.options);

          const compression_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT' }];
          compression.options = compression_inherit.concat(compression.options);

          const deduplication_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT' }];
          deduplication.options = deduplication_inherit.concat(deduplication.options);

          const volblocksize_inherit: Option[] = [{ label: `${inheritTr}`, value: 'INHERIT' }];
          volblocksize.options = volblocksize_inherit.concat(volblocksize.options);

          entityForm.formGroup.controls['sync'].setValue('INHERIT');
          entityForm.formGroup.controls['compression'].setValue('INHERIT');
          entityForm.formGroup.controls['deduplication'].setValue('INHERIT');
          entityForm.formGroup.controls['readonly'].setValue('INHERIT');
          const root = this.parent.split('/')[0];
          this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(untilDestroyed(this)).subscribe((res) => {
            this.entityForm.formGroup.controls['volblocksize'].setValue(res);
            this.minimum_recommended_zvol_volblocksize = res;
          });
        } else {
          let parent_dataset: string | string[] = pk_dataset[0].name.split('/');
          parent_dataset.pop();
          parent_dataset = parent_dataset.join('/');

          this.ws.call('pool.dataset.query', [[['id', '=', parent_dataset]]]).pipe(untilDestroyed(this)).subscribe((parent_dataset_res) => {
            this.custActions = null;

            sparse.isHidden = true;
            volblocksize.isHidden = true;

            this.customFilter = [[['id', '=', this.parent]]];
            let sync_collection: Option[] = [{ label: pk_dataset[0].sync.value, value: pk_dataset[0].sync.value }];
            let compression_collection: Option[] = [{
              label: pk_dataset[0].compression.value,
              value: pk_dataset[0].compression.value,
            }];
            let deduplication_collection: Option[] = [{
              label: pk_dataset[0].deduplication.value,
              value: pk_dataset[0].deduplication.value,
            }];

            const volumesize = pk_dataset[0].volsize.parsed;

            // keep track of original volume size data so we can check to see if the user intended to change since
            // decimal has to be truncated to three decimal places
            this.origVolSize = volumesize;

            const humansize = this.storageService.convertBytestoHumanReadable(volumesize);
            this.origHuman = humansize;

            entityForm.formGroup.controls['name'].setValue(pk_dataset[0].name);
            if (pk_dataset[0].comments) {
              entityForm.formGroup.controls['comments'].setValue(pk_dataset[0].comments.value);
            } else {
              entityForm.formGroup.controls['comments'].setValue('');
            }

            entityForm.formGroup.controls['volsize'].setValue(humansize);

            if (pk_dataset[0].sync.source === 'INHERITED' || pk_dataset[0].sync.source === 'DEFAULT') {
              sync_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].sync.rawvalue})`, value: parent_dataset_res[0].sync.value }];
            } else {
              sync_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].sync.rawvalue})`, value: 'INHERIT' }];
              entityForm.formGroup.controls['sync'].setValue(pk_dataset[0].sync.value);
            }
            sync.options = sync_collection.concat(sync.options);

            if (pk_dataset[0].compression.source === 'DEFAULT') {
              compression_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].compression.rawvalue})`, value: parent_dataset_res[0].compression.value }];
            } else {
              compression_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].compression.rawvalue})`, value: 'INHERIT' }];
            }
            compression.options = compression_collection.concat(compression.options);

            if (pk_dataset[0].compression.source === 'INHERITED') {
              entityForm.formGroup.controls['compression'].setValue('INHERIT');
            } else {
              entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value);
            }

            if (pk_dataset[0].deduplication.source === 'INHERITED' || pk_dataset[0].deduplication.source === 'DEFAULT') {
              deduplication_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].deduplication.rawvalue})`, value: parent_dataset_res[0].deduplication.value }];
            } else {
              deduplication_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].deduplication.rawvalue})`, value: 'INHERIT' }];
              entityForm.formGroup.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
            }
            deduplication.options = deduplication_collection.concat(deduplication.options);

            entityForm.formGroup.controls['sync'].setValue(pk_dataset[0].sync.value);
            if (pk_dataset[0].compression.value === 'GZIP') {
              entityForm.formGroup.controls['compression'].setValue(pk_dataset[0].compression.value + '-6');
            }
            entityForm.formGroup.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
          });
        }
      });
    });
  }

  blurVolsize(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['volsize'].setValue(this.storageService.humanReadable);
    }
  }

  addSubmit(body: any): Observable<any> {
    const data: any = this.sendAsBasicOrAdvanced(body);

    if (data.sync === 'INHERIT') {
      delete (data.sync);
    }
    if (data.compression === 'INHERIT') {
      delete (data.compression);
    }
    if (data.deduplication === 'INHERIT') {
      delete (data.deduplication);
    }
    if (data.readonly === 'INHERIT') {
      delete (data.readonly);
    }
    if (data.volblocksize !== 'INHERIT') {
      let volblocksize_integer_value = data.volblocksize.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksize_integer_value = parseInt(volblocksize_integer_value, 10);

      if (volblocksize_integer_value === 512) {
        volblocksize_integer_value = 512;
      } else {
        volblocksize_integer_value = volblocksize_integer_value * 1024;
      }

      data.volsize = data.volsize + (volblocksize_integer_value - data.volsize % volblocksize_integer_value);
    } else {
      delete (data.volblocksize);
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

    return this.ws.call('pool.dataset.create', [data]);
  }

  editSubmit(body: any): void {
    this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).pipe(untilDestroyed(this)).subscribe((datasets) => {
      this.edit_data = this.sendAsBasicOrAdvanced(body);

      if (this.edit_data.inherit_encryption) {
        delete this.edit_data.encryption;
      } else if (this.edit_data.encryption) {
        this.edit_data['encryption_options'] = {};
        if (this.edit_data.encryption_type === 'key') {
          this.edit_data.encryption_options.generate_key = this.edit_data.generate_key;
          if (!this.edit_data.generate_key) {
            this.edit_data.encryption_options.key = this.edit_data.key;
          }
        } else if (this.edit_data.encryption_type === 'passphrase') {
          this.edit_data.encryption_options.passphrase = this.edit_data.passphrase;
          this.edit_data.encryption_options.pbkdf2iters = this.edit_data.pbkdf2iters;
        }
        this.edit_data.encryption_options.algorithm = this.edit_data.algorithm;
      }

      delete this.edit_data.inherit_encryption;
      delete this.edit_data.key;
      delete this.edit_data.generate_key;
      delete this.edit_data.passphrase;
      delete this.edit_data.confirm_passphrase;
      delete this.edit_data.pbkdf2iters;
      delete this.edit_data.encryption_type;
      delete this.edit_data.algorithm;

      let volblocksize_integer_value: number | string = datasets[0].volblocksize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksize_integer_value = parseInt(volblocksize_integer_value, 10);
      if (volblocksize_integer_value === 512) {
        volblocksize_integer_value = 512;
      } else {
        volblocksize_integer_value = volblocksize_integer_value * 1024;
      }
      if (this.edit_data.volsize && this.edit_data.volsize % volblocksize_integer_value !== 0) {
        this.edit_data.volsize = this.edit_data.volsize
          + (volblocksize_integer_value - this.edit_data.volsize % volblocksize_integer_value);
      }
      let rounded_vol_size = datasets[0].volsize.parsed;

      if (datasets[0].volsize.parsed % volblocksize_integer_value !== 0) {
        rounded_vol_size = datasets[0].volsize.parsed
          + (volblocksize_integer_value - datasets[0].volsize.parsed % volblocksize_integer_value);
      }

      if (!this.edit_data.volsize || this.edit_data.volsize >= rounded_vol_size) {
        this.ws.call('pool.dataset.update', [this.parent, this.edit_data]).pipe(untilDestroyed(this)).subscribe(() => {
          this.loader.close();
          this.modalService.close('slide-in-form');
          this.modalService.refreshTable();
        }, (eres) => {
          this.loader.close();
          new EntityUtils().handleWSError(this.entityForm, eres);
        });
      } else {
        this.loader.close();
        this.dialogService.info(helptext.zvol_save_errDialog.title, helptext.zvol_save_errDialog.msg);
        this.modalService.close('slide-in-form');
      }
    });
  }

  customSubmit(body: any): void {
    this.loader.open();

    if (this.isNew) {
      this.addSubmit(body).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      }, (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      });
    } else {
      this.editSubmit(body);
    }
  }

  setParent(id: string): void {
    this.parent = id;
  }
}
