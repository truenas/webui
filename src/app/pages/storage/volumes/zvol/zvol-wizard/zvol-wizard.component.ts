import { Component } from '@angular/core';
import {
  Validators, FormControl, ValidationErrors, FormGroup,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { Router, ActivatedRoute } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { CoreService } from 'app/core/services/core-service/core.service';
import { DatasetType } from 'app/enums/dataset-type.enum';
import { DeduplicationSetting } from 'app/enums/deduplication-setting.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/storage/volumes/zvol-form';
import { EntityWizardAction, WizardConfiguration } from 'app/interfaces/entity-wizard.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { Wizard } from 'app/pages/common/entity/entity-form/models/wizard.interface';
import { forbiddenValues } from 'app/pages/common/entity/entity-form/validators/forbidden-values-validation';
import { EntityWizardComponent } from 'app/pages/common/entity/entity-wizard/entity-wizard.component';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService, StorageService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
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
  selector: 'app-zvol-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>',
})
export class ZvolWizardComponent implements WizardConfiguration {
  addWsCall = 'pool.dataset.create' as const;
  protected path: string;
  queryCall = 'pool.dataset.query' as const;
  advanced_field = ['volblocksize'];
  isBasicMode = true;
  protected isNew = true;
  protected isEntity = true;
  parent: string;
  volid: string;
  customFilter: any[] = [];
  protected entityWizard: EntityWizardComponent;
  minimum_recommended_zvol_volblocksize: keyof ZvolWizardComponent['reverseZvolBlockSizeMap'];
  namesInUse: string[] = [];
  title: string;
  isLinear = true;
  summary: Record<string, unknown> = {};
  summaryTitle = 'Zvol Summary';

  protected origVolSize: number;
  protected origHuman: string;

  custActions: EntityWizardAction[] = [
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

  wizardConfig: Wizard[] = [
    {
      label: T('Select Path'),
      fieldConfig: [
        {
          type: 'explorer',
          class: 'meExplorer',
          initial: '/mnt/',
          explorerType: 'directory',
          name: 'path',
          placeholder: T('ZFS Volume'),
          value: '/nonexistent',
          tooltip: T('Choose a path to the user\'s\
 home directory. If the directory exists and matches the username,\
 it is set as the user\'s home directory. When the path does not\
 end with a subdirectory matching the username, a new subdirectory is\
 created. The full path to the user\'s home directory is shown\
 here when editing a user.'),
        },
      ],
    },
    {
      label: T('Add ZVol'),
      fieldConfig: [
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
              const config = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'volsize');

              const size = control.value && typeof control.value == 'string' ? this.storageService.convertHumanStringToNum(control.value, true) : null;
              const humanSize = control.value;

              let errors = control.value && Number.isNaN(size)
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
  ];

  isCustActionVisible(actionId: string, stepperIndex: number): boolean {
    if (!(stepperIndex == 1)) {
      return false;
    }
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

    // TODO: Incorrect type comparison, probably a bug.
    if (this.origHuman !== (data.volsize as any)) {
      data.volsize = this.storageService.convertHumanStringToNum(data.volsize, true);
    } else {
      delete data.volsize;
    }
    return data;
  }

  constructor(
    protected core: CoreService,
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialogService: DialogService,
    protected storageService: StorageService,
    private translate: TranslateService,
    protected modalService: ModalService,
  ) {}

  preInit(entityWizard: EntityWizardComponent): void {
    this.entityWizard = entityWizard;
  }

  async preInitZvolForm(entityWizard: EntityWizardComponent): Promise<void> {
    const zvolEntityForm = entityWizard.formArray.get([1]) as FormGroup;
    if (!this.parent) return;

    const sparse = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'sparse');
    const sync = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'sync') as FormSelectConfig;
    const compression = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'compression') as FormSelectConfig;
    const deduplication = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'deduplication') as FormSelectConfig;
    const volblocksize = this.wizardConfig[1].fieldConfig.find((c) => c.name === 'volblocksize') as FormSelectConfig;

    this.isNew = true;

    await this.ws.call('pool.dataset.query', [[['id', '=', this.parent]]]).toPromise().then((pk_dataset) => {
      const children = (pk_dataset[0].children);
      entityWizard.setDisabled('name', false, 1);
      if (children.length > 0) {
        children.forEach((child) => {
          this.namesInUse.push(/[^/]*$/.exec(child.name)[0]);
        });
      }
      const inheritTr = this.translate.instant('Inherit');
      if (pk_dataset && pk_dataset[0].type === DatasetType.Filesystem) {
        const sync_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].sync.rawvalue})`, value: 'INHERIT' }];
        const compression_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].compression.rawvalue})`, value: 'INHERIT' }];
        const deduplication_inherit: Option[] = [{ label: `${inheritTr} (${pk_dataset[0].deduplication.rawvalue})`, value: 'INHERIT' }];
        const volblocksize_inherit: Option[] = [{ label: `${inheritTr}`, value: 'INHERIT' }];

        sync.options = sync_inherit.concat(sync.options);
        compression.options = compression_inherit.concat(compression.options);
        deduplication.options = deduplication_inherit.concat(deduplication.options);
        volblocksize.options = volblocksize_inherit.concat(volblocksize.options);

        zvolEntityForm.controls['sync'].setValue('INHERIT');
        zvolEntityForm.controls['compression'].setValue('INHERIT');
        zvolEntityForm.controls['deduplication'].setValue('INHERIT');

        this.title = helptext.zvol_title_add;

        const root = this.parent.split('/')[0];
        this.ws.call('pool.dataset.recommended_zvol_blocksize', [root]).pipe(untilDestroyed(this)).subscribe((res) => {
          zvolEntityForm.controls['volblocksize'].setValue(res);
          // TODO: Check if actual server response matches map
          this.minimum_recommended_zvol_volblocksize = res as any;
        });
      } else {
        let parent_dataset: string | string[] = pk_dataset[0].name.split('/');
        parent_dataset.pop();
        parent_dataset = parent_dataset.join('/');

        this.ws.call('pool.dataset.query', [[['id', '=', parent_dataset]]]).pipe(untilDestroyed(this)).subscribe((parent_dataset_res) => {
          this.custActions = null;
          this.entityWizard.setDisabled('name', true, 1);
          sparse['isHidden'] = true;
          volblocksize['isHidden'] = true;
          this.wizardConfig[1].fieldConfig.find((c) => c.name === 'sparse')['isHidden'] = true;
          this.customFilter = [[['id', '=', this.parent]]];

          const volumesize = pk_dataset[0].volsize.parsed;

          this.isNew = false;
          this.title = helptext.zvol_title_edit;

          // keep track of original volume size data so we can check to see if the user intended to change since
          // decimal has to be truncated to three decimal places
          this.origVolSize = volumesize;

          const humansize = this.storageService.convertBytestoHumanReadable(volumesize);
          this.origHuman = humansize;

          zvolEntityForm.controls['name'].setValue(pk_dataset[0].name);
          if (pk_dataset[0].comments) {
            zvolEntityForm.controls['comments'].setValue(pk_dataset[0].comments.value);
          } else {
            zvolEntityForm.controls['comments'].setValue('');
          }

          zvolEntityForm.controls['volsize'].setValue(humansize);

          let sync_collection: Option[];
          if (pk_dataset[0].sync.source === 'INHERITED' || pk_dataset[0].sync.source === 'DEFAULT') {
            sync_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].sync.rawvalue})`, value: parent_dataset_res[0].sync.value }];
          } else {
            sync_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].sync.rawvalue})`, value: 'INHERIT' }];
            zvolEntityForm.controls['sync'].setValue(pk_dataset[0].sync.value);
          }

          sync.options = sync_collection.concat(sync.options);

          let compression_collection: Option[];
          if (pk_dataset[0].compression.source === 'INHERITED' || pk_dataset[0].compression.source === 'DEFAULT') {
            compression_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].compression.rawvalue})`, value: parent_dataset_res[0].compression.value }];
          } else {
            compression_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].compression.rawvalue})`, value: 'INHERIT' }];
            zvolEntityForm.controls['compression'].setValue(pk_dataset[0].compression.value);
          }

          compression.options = compression_collection.concat(compression.options);

          let deduplication_collection: Option[];
          if (pk_dataset[0].deduplication.source === 'INHERITED' || pk_dataset[0].deduplication.source === 'DEFAULT') {
            deduplication_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].deduplication.rawvalue})`, value: parent_dataset_res[0].deduplication.value }];
          } else {
            deduplication_collection = [{ label: `${inheritTr} (${parent_dataset_res[0].deduplication.rawvalue})`, value: 'INHERIT' }];
            zvolEntityForm.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
          }

          deduplication.options = deduplication_collection.concat(deduplication.options);

          zvolEntityForm.controls['sync'].setValue(pk_dataset[0].sync.value);
          if (pk_dataset[0].compression.value === 'GZIP') {
            zvolEntityForm.controls['compression'].setValue(pk_dataset[0].compression.value + '-6');
          } else {
            zvolEntityForm.controls['compression'].setValue(pk_dataset[0].compression.value);
          }
          zvolEntityForm.controls['deduplication'].setValue(pk_dataset[0].deduplication.value);
        });
      }
    });
  }

  afterInit(entityWizard: EntityWizardComponent): void {
    const zvolEntityForm = this.entityWizard.formArray.get([1]) as FormGroup;
    (entityWizard.formArray.get([0]) as FormGroup).get('path').valueChanges.pipe(untilDestroyed(this)).subscribe((pool: string) => {
      if (pool.includes('mnt')) {
        const split = pool.split('/');
        this.parent = '';
        for (let i = 2; i < split.length; i++) {
          this.parent += split[i];
          if (i + 1 < split.length) {
            this.parent += '/';
          }
        }
        this.summary[T('Dataset Path')] = this.parent;
        (entityWizard.formArray.get([0]) as FormGroup).controls['path'].setValue(this.parent);
      }
    });
    zvolEntityForm.controls['name'].valueChanges.pipe(untilDestroyed(this)).subscribe((name) => {
      this.summary[T('Zvol Name')] = name;
    });
    zvolEntityForm.controls['comments'].valueChanges.pipe(untilDestroyed(this)).subscribe((comments) => {
      this.summary[T('Comments')] = comments;
    });
    zvolEntityForm.controls['volsize'].valueChanges.pipe(untilDestroyed(this)).subscribe((volsize) => {
      this.summary[T('Zvol Size')] = volsize;
    });
    zvolEntityForm.controls['force_size'].valueChanges.pipe(untilDestroyed(this)).subscribe((force_size) => {
      this.summary[T('Force Size')] = force_size;
    });
    zvolEntityForm.controls['sync'].valueChanges.pipe(untilDestroyed(this)).subscribe((sync) => {
      this.summary[T('Sync')] = sync;
    });
    zvolEntityForm.controls['compression'].valueChanges.pipe(untilDestroyed(this)).subscribe((compression) => {
      this.summary[T('Compression Level')] = compression;
    });
    zvolEntityForm.controls['deduplication'].valueChanges.pipe(untilDestroyed(this)).subscribe((deduplication) => {
      this.summary[T('ZFS Deduplication')] = deduplication;
    });
    zvolEntityForm.controls['sparse'].valueChanges.pipe(untilDestroyed(this)).subscribe((sparse) => {
      this.summary[T('Sparse')] = sparse;
    });
    zvolEntityForm.controls['volblocksize'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: keyof ZvolWizardComponent['reverseZvolBlockSizeMap']) => {
      const res_number = parseInt(this.reverseZvolBlockSizeMap[res], 10);
      if (this.minimum_recommended_zvol_volblocksize) {
        const recommendedSize = parseInt(this.reverseZvolBlockSizeMap[this.minimum_recommended_zvol_volblocksize], 0);
        if (res_number < recommendedSize) {
          this.wizardConfig[1].fieldConfig.find((c) => c.name === 'volblocksize').warnings = `${this.translate.instant(helptext.blocksize_warning.a)} ${this.minimum_recommended_zvol_volblocksize}. ${this.translate.instant(helptext.blocksize_warning.b)}`;
        } else {
          this.wizardConfig[1].fieldConfig.find((c) => c.name === 'volblocksize').warnings = null;
        }
      }
      this.summary[T('Block Size')] = res;
    });
  }

  blurVolsize(): void {
    const zvolEntityForm = this.entityWizard.formArray.get([1]) as FormGroup;
    if (zvolEntityForm) {
      zvolEntityForm.controls['volsize'].setValue(this.storageService.humanReadable);
    }
  }

  addSubmit(body: any): Observable<any> {
    delete body.path;
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

    return this.ws.call('pool.dataset.create', [data]);
  }

  async customNext(stepper: MatStepper): Promise<void> {
    if (stepper.selectedIndex == 0) {
      if (!this.parent) {
        this.wizardConfig[0].fieldConfig.find((c) => c.name === 'path').warnings = 'Please select a ZFS Volume';
        return;
      }
      await this.preInitZvolForm(this.entityWizard);
    }
    stepper.next();
  }

  customSubmit(body: any): void {
    this.loader.open();

    if (this.isNew) {
      this.addSubmit(body).pipe(untilDestroyed(this)).subscribe((restPostResp) => {
        this.loader.close();
        this.modalService.close('slide-in-form').then(
          (closed) => {
            if (closed) {
              this.parent = null;
            }
          },
        );
        this.core.emit({ name: 'zvolCreated', sender: this, data: restPostResp });
        this.modalService.refreshTable();
      }, (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityWizard, res);
      });
    }
  }

  setParent(id: string): void {
    this.parent = id;
  }

  customCancel(): void {
    this.modalService.close('slide-in-form').then(
      (closed) => {
        if (closed) {
          this.parent = null;
        }
      },
    );
  }
}
