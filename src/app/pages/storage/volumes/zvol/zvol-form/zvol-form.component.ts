import { Component } from '@angular/core';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  DatasetEncryptionType, DatasetRecordSize, DatasetSync, DatasetType,
} from 'app/enums/dataset.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { inherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/zvol-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Option } from 'app/interfaces/option.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import {
  FieldConfig,
  FormCheckboxConfig,
  FormSelectConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { StorageService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';

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
  advancedFields = ['volblocksize'];
  isBasicMode = true;
  isNew = true;
  isEntity = true;
  parent: string;
  volid: string;
  customFilter: [[QueryFilter<unknown>]?] = [];
  edit_data: any;
  protected entityForm: EntityFormComponent;
  minimum_recommended_zvol_volblocksize: DatasetRecordSize;
  namesInUse: string[] = [];
  title: string;

  protected origVolSize: number;
  protected origHuman: string | number;

  protected non_encrypted_warned = false;
  protected encrypted_parent = false;
  protected inherit_encryption = true;
  protected passphrase_parent = false;
  protected encryption_type: 'key' | 'passphrase' = 'key';
  protected generate_key = true;
  protected encryption_algorithm: string;

  customActions = [
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
            const volsizeConfig = this.fieldSets[0].config.find((config) => config.name === 'volsize');

            const size = control.value && typeof control.value === 'string' ? this.storageService.convertHumanStringToNum(control.value, true) : null;
            const humanSize = control.value;

            let errors = control.value && Number.isNaN(size)
              ? { invalid_byte_string: true }
              : null;

            if (errors) {
              volsizeConfig.hasErrors = true;
              volsizeConfig.errors = globalHelptext.human_readable.input_error;
            } else if (size === 0) {
              volsizeConfig.hasErrors = true;
              volsizeConfig.errors = helptext.zvol_volsize_zero_error;
              errors = { invalid_byte_string: true };
            } else if ((this.origHuman && humanSize)
                      && (humanSize !== this.origHuman)
                      && (size < this.origVolSize)) {
              volsizeConfig.hasErrors = true;
              volsizeConfig.errors = helptext.zvol_volsize_shrink_error;
              errors = { invalid_byte_string: true };
            } else {
              volsizeConfig.hasErrors = false;
              volsizeConfig.errors = '';
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
          { label: this.translate.instant('Standard'), value: DatasetSync.Standard },
          { label: this.translate.instant('Always'), value: DatasetSync.Always },
          { label: this.translate.instant('Disabled'), value: DatasetSync.Disabled },
        ],
      },
      {
        type: 'select',
        name: 'compression',
        placeholder: helptext.zvol_compression_placeholder,
        tooltip: helptext.zvol_compression_tooltip,
        options: [
          { label: this.translate.instant('Off'), value: 'OFF' },
          { label: this.translate.instant('lz4 (recommended)'), value: 'LZ4' },
          { label: this.translate.instant('zstd (default level, 3)'), value: 'ZSTD' },
          { label: this.translate.instant('zstd-5 (slow)'), value: 'ZSTD-5' },
          { label: this.translate.instant('zstd-7 (very slow)'), value: 'ZSTD-7' },
          { label: this.translate.instant('zstd-fast (default level, 1)'), value: 'ZSTD-FAST' },
          { label: this.translate.instant('gzip (default level, 6)'), value: 'GZIP' },
          { label: this.translate.instant('gzip-1 (fastest)'), value: 'GZIP-1' },
          { label: this.translate.instant('gzip-9 (maximum, slow)'), value: 'GZIP-9' },
          { label: this.translate.instant('zle (runs of zeros)'), value: 'ZLE' },
          { label: this.translate.instant('lzjb (legacy, not recommended)'), value: 'LZJB' },
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
          { label: this.translate.instant('On'), value: DeduplicationSetting.On },
          { label: this.translate.instant('Verify'), value: DeduplicationSetting.Verify },
          { label: this.translate.instant('Off'), value: DeduplicationSetting.Off },
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
          { label: this.translate.instant('On'), value: OnOff.On },
          { label: this.translate.instant('Off'), value: OnOff.Off },
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

  isCustomActionVisible(actionId: string): boolean {
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
      data.volsize = this.storageService.convertHumanStringToNum(data.volsize as any, true);
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
      this.encryption_fields.forEach((field) => {
        this.entityForm.setDisabled(field, true, true);
      });
      _.find(this.fieldSets, { name: 'encryption_divider' }).divider = false;
      this.entityForm.setDisabled('encryption', true, true);
      this.entityForm.setDisabled('inherit_encryption', true, true);
    }

    if (this.isNew) {
      this.title = helptext.zvol_title_add;
    } else {
      this.title = helptext.zvol_title_edit;
    }

    this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).pipe(untilDestroyed(this)).subscribe((pkDatasets) => {
      this.encrypted_parent = pkDatasets[0].encrypted;
      this.encryption_algorithm = pkDatasets[0].encryption_algorithm.value;
      const children = (pkDatasets[0].children);
      if (children.length > 0) {
        children.forEach((child) => {
          this.namesInUse.push(/[^/]*$/.exec(child.name)[0]);
        });
      }

      let inheritEncryptPlaceholder: string = helptext.dataset_form_encryption.inherit_checkbox_notencrypted;
      if (this.encrypted_parent) {
        if (pkDatasets[0].key_format.value === DatasetEncryptionType.Passphrase) {
          this.passphrase_parent = true;
          // if parent is passphrase this dataset cannot be a key type
          this.encryption_type = 'passphrase';
          _.find(this.fieldConfig, { name: 'encryption_type' }).isHidden = true;
        }
        inheritEncryptPlaceholder = helptext.dataset_form_encryption.inherit_checkbox_encrypted;
      }
      _.find(this.fieldConfig, { name: 'inherit_encryption' }).placeholder = inheritEncryptPlaceholder;

      if (this.isNew) {
        const encryptionAlgorithmConfig = _.find(this.fieldConfig, { name: 'algorithm' }) as FormSelectConfig;
        const encryptionAlgorithmControl = this.entityForm.formGroup.controls['algorithm'];
        let parentAlgorithm;
        if (this.encrypted_parent && pkDatasets[0].encryption_algorithm) {
          parentAlgorithm = pkDatasets[0].encryption_algorithm.value;
          encryptionAlgorithmControl.setValue(parentAlgorithm);
        }
        this.ws.call('pool.dataset.encryption_algorithm_choices').pipe(untilDestroyed(this)).subscribe((algorithms) => {
          for (const algorithm in algorithms) {
            if (algorithms.hasOwnProperty(algorithm)) {
              encryptionAlgorithmConfig.options.push({ label: algorithm, value: algorithm });
            }
          }
        });
        _.find(this.fieldConfig, { name: 'encryption' }).isHidden = true;
        const inheritEncryptionControl = this.entityForm.formGroup.controls['inherit_encryption'];
        const encryptionControl = this.entityForm.formGroup.controls['encryption'];
        const encryptionTypeControl = this.entityForm.formGroup.controls['encryption_type'];
        const allEncryptionFields = this.encryption_fields.concat(this.key_fields, this.passphrase_fields);
        if (this.passphrase_parent) {
          encryptionTypeControl.setValue('passphrase');
        }
        this.encryption_fields.forEach((field) => {
          this.entityForm.setDisabled(field, true, true);
        });
        inheritEncryptionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((inherit: boolean) => {
          this.inherit_encryption = inherit;
          if (inherit) {
            allEncryptionFields.forEach((field) => {
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
        encryptionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((encryption: boolean) => {
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
              allEncryptionFields.forEach((field) => {
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
        encryptionTypeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((type: 'key' | 'passphrase') => {
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
        this.entityForm.formGroup.controls['generate_key'].valueChanges.pipe(untilDestroyed(this)).subscribe((generateKey: boolean) => {
          this.generate_key = generateKey;
          this.entityForm.setDisabled('key', generateKey, generateKey);
        });
      } else {
        entityForm.setDisabled('name', true);
      }

      this.entityForm.formGroup.controls['volblocksize'].valueChanges.pipe(untilDestroyed(this)).subscribe((recordSize: DatasetRecordSize) => {
        const resNumber = parseInt(this.reverseZvolBlockSizeMap[recordSize], 10);
        if (this.minimum_recommended_zvol_volblocksize) {
          const recommendedSizeNumber = parseInt(
            this.reverseZvolBlockSizeMap[this.minimum_recommended_zvol_volblocksize], 0,
          );
          if (resNumber < recommendedSizeNumber) {
            _.find(this.fieldConfig, { name: 'volblocksize' }).warnings = `${this.translate.instant(helptext.blocksize_warning.a)} ${this.minimum_recommended_zvol_volblocksize}. ${this.translate.instant(helptext.blocksize_warning.b)}`;
          } else {
            _.find(this.fieldConfig, { name: 'volblocksize' }).warnings = null;
          }
        }
      });

      const inheritTr = this.translate.instant('Inherit');
      const readonlyInherit: Option[] = [{ label: `${inheritTr} (${pkDatasets[0].readonly.rawvalue})`, value: inherit }];
      const readonly = _.find(this.fieldConfig, { name: 'readonly' }) as FormSelectConfig;
      readonly.options = readonlyInherit.concat(readonly.options);
      let readonlyValue;
      if (this.isNew) {
        readonlyValue = inherit;
      } else {
        readonlyValue = pkDatasets[0].readonly.value;
        if (
          pkDatasets[0].readonly.source === ZfsPropertySource.Default
          || pkDatasets[0].readonly.source === ZfsPropertySource.Inherited
        ) {
          readonlyValue = inherit;
        }
      }
      entityForm.formGroup.controls['readonly'].setValue(readonlyValue);

      const sync = _.find(this.fieldConfig, { name: 'sync' }) as FormSelectConfig;
      const sparse = _.find(this.fieldConfig, { name: 'sparse' }) as FormCheckboxConfig;
      const compression = _.find(this.fieldConfig, { name: 'compression' }) as FormSelectConfig;
      const deduplication = _.find(this.fieldConfig, { name: 'deduplication' }) as FormSelectConfig;
      const volblocksize = _.find(this.fieldConfig, { name: 'volblocksize' }) as FormSelectConfig;

      if (pkDatasets && pkDatasets[0].type === DatasetType.Filesystem) {
        const syncInherit: Option[] = [{ label: `${inheritTr} (${pkDatasets[0].sync.rawvalue})`, value: inherit }];
        sync.options = syncInherit.concat(sync.options);

        const compressionInherit: Option[] = [{ label: `${inheritTr} (${pkDatasets[0].compression.rawvalue})`, value: inherit }];
        compression.options = compressionInherit.concat(compression.options);

        const deduplicationInherit: Option[] = [{ label: `${inheritTr} (${pkDatasets[0].deduplication.rawvalue})`, value: inherit }];
        deduplication.options = deduplicationInherit.concat(deduplication.options);

        const volblocksizeInherit: Option[] = [{ label: `${inheritTr}`, value: inherit }];
        volblocksize.options = volblocksizeInherit.concat(volblocksize.options);

        entityForm.formGroup.controls['sync'].setValue(inherit);
        entityForm.formGroup.controls['compression'].setValue(inherit);
        entityForm.formGroup.controls['deduplication'].setValue(inherit);
        entityForm.formGroup.controls['readonly'].setValue(inherit);
        const root = this.parent.split('/')[0];
        this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(untilDestroyed(this)).subscribe((recommendedSize) => {
          this.entityForm.formGroup.controls['volblocksize'].setValue(recommendedSize);
          this.minimum_recommended_zvol_volblocksize = recommendedSize;
        });
      } else {
        let parentDataset: string | string[] = pkDatasets[0].name.split('/');
        parentDataset.pop();
        parentDataset = parentDataset.join('/');

        this.ws.call('pool.dataset.query', [[['id', '=', parentDataset]]]).pipe(untilDestroyed(this)).subscribe((parentDataset) => {
          this.customActions = null;

          sparse.isHidden = true;
          volblocksize.isHidden = true;

          this.customFilter = [[['id', '=', this.parent]]];
          let syncOptions: Option[];
          let compressionOptions: Option[];
          let deduplicationOptions: Option[];

          const volumesize = pkDatasets[0].volsize.parsed;

          // keep track of original volume size data so we can check to see if the user intended to change since
          // decimal has to be truncated to three decimal places
          this.origVolSize = volumesize;

          const humansize = this.storageService.convertBytesToHumanReadable(volumesize);
          this.origHuman = humansize;

          entityForm.formGroup.controls['name'].setValue(pkDatasets[0].name);
          if (pkDatasets[0].comments) {
            entityForm.formGroup.controls['comments'].setValue(pkDatasets[0].comments.value);
          } else {
            entityForm.formGroup.controls['comments'].setValue('');
          }

          entityForm.formGroup.controls['volsize'].setValue(humansize);

          if (
            pkDatasets[0].sync.source === ZfsPropertySource.Inherited
            || pkDatasets[0].sync.source === ZfsPropertySource.Default
          ) {
            syncOptions = [{ label: `${inheritTr} (${parentDataset[0].sync.rawvalue})`, value: parentDataset[0].sync.value }];
          } else {
            syncOptions = [{ label: `${inheritTr} (${parentDataset[0].sync.rawvalue})`, value: inherit }];
            entityForm.formGroup.controls['sync'].setValue(pkDatasets[0].sync.value);
          }
          sync.options = syncOptions.concat(sync.options);

          if (pkDatasets[0].compression.source === ZfsPropertySource.Default) {
            compressionOptions = [{ label: `${inheritTr} (${parentDataset[0].compression.rawvalue})`, value: parentDataset[0].compression.value }];
          } else {
            compressionOptions = [{ label: `${inheritTr} (${parentDataset[0].compression.rawvalue})`, value: inherit }];
          }
          compression.options = compressionOptions.concat(compression.options);

          if (pkDatasets[0].compression.source === ZfsPropertySource.Inherited) {
            entityForm.formGroup.controls['compression'].setValue(inherit);
          } else {
            entityForm.formGroup.controls['compression'].setValue(pkDatasets[0].compression.value);
          }

          if (
            pkDatasets[0].deduplication.source === ZfsPropertySource.Inherited
            || pkDatasets[0].deduplication.source === ZfsPropertySource.Default
          ) {
            deduplicationOptions = [{ label: `${inheritTr} (${parentDataset[0].deduplication.rawvalue})`, value: parentDataset[0].deduplication.value }];
          } else {
            deduplicationOptions = [{ label: `${inheritTr} (${parentDataset[0].deduplication.rawvalue})`, value: inherit }];
            entityForm.formGroup.controls['deduplication'].setValue(pkDatasets[0].deduplication.value);
          }
          deduplication.options = deduplicationOptions.concat(deduplication.options);

          entityForm.formGroup.controls['sync'].setValue(pkDatasets[0].sync.value);
          if (pkDatasets[0].compression.value === 'GZIP') {
            entityForm.formGroup.controls['compression'].setValue(pkDatasets[0].compression.value + '-6');
          }
          entityForm.formGroup.controls['deduplication'].setValue(pkDatasets[0].deduplication.value);
        });
      }
    });
  }

  blurVolsize(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['volsize'].setValue(this.storageService.humanReadable);
    }
  }

  addSubmit(body: any): Observable<Dataset> {
    const data: any = this.sendAsBasicOrAdvanced(body);

    if (data.sync === inherit) {
      delete (data.sync);
    }
    if (data.compression === inherit) {
      delete (data.compression);
    }
    if (data.deduplication === inherit) {
      delete (data.deduplication);
    }
    if (data.readonly === inherit) {
      delete (data.readonly);
    }
    if (data.volblocksize !== inherit) {
      let volblocksizeIntegerValue = data.volblocksize.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksizeIntegerValue = parseInt(volblocksizeIntegerValue, 10);

      if (volblocksizeIntegerValue === 512) {
        volblocksizeIntegerValue = 512;
      } else {
        volblocksizeIntegerValue = volblocksizeIntegerValue * 1024;
      }

      data.volsize = data.volsize + (volblocksizeIntegerValue - data.volsize % volblocksizeIntegerValue);
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

      let volblocksizeIntegerValue: number | string = datasets[0].volblocksize.value.match(/[a-zA-Z]+|[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)+/g)[0];
      volblocksizeIntegerValue = parseInt(volblocksizeIntegerValue, 10);
      if (volblocksizeIntegerValue === 512) {
        volblocksizeIntegerValue = 512;
      } else {
        volblocksizeIntegerValue = volblocksizeIntegerValue * 1024;
      }
      if (this.edit_data.volsize && this.edit_data.volsize % volblocksizeIntegerValue !== 0) {
        this.edit_data.volsize = this.edit_data.volsize
          + (volblocksizeIntegerValue - this.edit_data.volsize % volblocksizeIntegerValue);
      }
      let roundedVolSize = datasets[0].volsize.parsed;

      if (datasets[0].volsize.parsed % volblocksizeIntegerValue !== 0) {
        roundedVolSize = datasets[0].volsize.parsed
          + (volblocksizeIntegerValue - datasets[0].volsize.parsed % volblocksizeIntegerValue);
      }

      if (!this.edit_data.volsize || this.edit_data.volsize >= roundedVolSize) {
        this.ws.call('pool.dataset.update', [this.parent, this.edit_data]).pipe(untilDestroyed(this)).subscribe(() => {
          this.loader.close();
          this.modalService.closeSlideIn();
          this.modalService.refreshTable();
        }, (eres) => {
          this.loader.close();
          new EntityUtils().handleWsError(this.entityForm, eres);
        });
      } else {
        this.loader.close();
        this.dialogService.info(helptext.zvol_save_errDialog.title, helptext.zvol_save_errDialog.msg);
        this.modalService.closeSlideIn();
      }
    });
  }

  customSubmit(body: any): void {
    this.loader.open();

    if (this.isNew) {
      this.addSubmit(body).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.modalService.closeSlideIn();
        this.modalService.refreshTable();
      }, (res) => {
        this.loader.close();
        new EntityUtils().handleWsError(this.entityForm, res);
      });
    } else {
      this.editSubmit(body);
    }
  }

  setParent(id: string): void {
    this.parent = id;
  }
}
