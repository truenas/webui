import { Component } from '@angular/core';
import {
  Validators, FormControl, ValidationErrors, AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { ExplorerType } from 'app/enums/explorer-type.enum';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import globalHelptext from 'app/helptext/global-helptext';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  IscsiService, WebSocketService, StorageService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';

@UntilDestroy()
@Component({
  selector: 'app-iscsi-initiator-form',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [IscsiService, StorageService],
})
export class ExtentFormComponent implements FormConfiguration {
  addCall = 'iscsi.extent.create' as const;
  queryCall = 'iscsi.extent.query' as const;
  editCall = 'iscsi.extent.update' as const;
  customFilter: any[] = [[['id', '=']]];
  routeSuccess: string[] = ['sharing', 'iscsi', 'extent'];
  isEntity = true;
  protected entityForm: EntityFormComponent;
  isNew = false;
  protected originalFilesize: number;

  fieldSets: FieldSet[] = [
    {
      name: helptextSharingIscsi.fieldset_extent_basic,
      label: true,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptextSharingIscsi.extent_placeholder_name,
          tooltip: helptextSharingIscsi.extent_tooltip_name,
          required: true,
          validation: helptextSharingIscsi.extent_validators_name,
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptextSharingIscsi.extent_placeholder_comment,
          tooltip: helptextSharingIscsi.extent_tooltip_comment,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptextSharingIscsi.extent_placeholder_enabled,
          tooltip: helptextSharingIscsi.extent_tooltip_enabled,
          value: true,
        },
      ],
    },
    {
      name: helptextSharingIscsi.fieldset_extent_type,
      label: true,
      class: 'type',
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'type',
          placeholder: helptextSharingIscsi.extent_placeholder_type,
          tooltip: helptextSharingIscsi.extent_tooltip_type,
          options: [
            {
              label: 'Device',
              value: 'DISK',
            },
            {
              label: 'File',
              value: 'FILE',
            },
          ],
        },
        {
          type: 'select',
          name: 'disk',
          placeholder: helptextSharingIscsi.extent_placeholder_disk,
          tooltip: helptextSharingIscsi.extent_tooltip_disk,
          options: [],
          isHidden: false,
          disabled: false,
          required: true,
          validation: helptextSharingIscsi.extent_validators_disk,
        },
        {
          type: 'explorer',
          explorerType: ExplorerType.File,
          initial: '/mnt',
          name: 'path',
          placeholder: helptextSharingIscsi.extent_placeholder_path,
          tooltip: helptextSharingIscsi.extent_tooltip_path,
          isHidden: false,
          disabled: false,
          required: true,
          validation: helptextSharingIscsi.extent_validators_path,
        },
        {
          type: 'input',
          name: 'filesize',
          placeholder: helptextSharingIscsi.extent_placeholder_filesize,
          tooltip: helptextSharingIscsi.extent_tooltip_filesize,
          isHidden: false,
          disabled: false,
          required: true,
          blurEvent: () => this.blurFilesize(),
          blurStatus: true,
          parent: this,
          validation: [Validators.required,
            (control: FormControl): ValidationErrors => {
              const config = this.fieldConfig.find((c) => c.name === 'filesize');
              const size = this.storageService.convertHumanStringToNum(control.value, true);
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
            },
          ],
        },
        {
          type: 'input',
          name: 'serial',
          placeholder: helptextSharingIscsi.extent_placeholder_serial,
          tooltip: helptextSharingIscsi.extent_tooltip_serial,
        },
        {
          type: 'select',
          name: 'blocksize',
          placeholder: helptextSharingIscsi.extent_placeholder_blocksize,
          tooltip: helptextSharingIscsi.extent_tooltip_blocksize,
          options: [
            {
              label: '512',
              value: 512,
            },
            {
              label: '1024',
              value: 1024,
            },
            {
              label: '2048',
              value: 2048,
            },
            {
              label: '4096',
              value: 4096,
            },
          ],
          value: 512,
        },
        {
          type: 'checkbox',
          name: 'pblocksize',
          placeholder: helptextSharingIscsi.extent_placeholder_pblocksize,
          tooltip: helptextSharingIscsi.extent_tooltip_pblocksize,
        },
        {
          type: 'input',
          name: 'avail_threshold',
          placeholder: helptextSharingIscsi.extent_placeholder_avail_threshold,
          tooltip: helptextSharingIscsi.extent_tooltip_avail_threshold,
          isHidden: false,
        },
      ],
    },
    {
      name: helptextSharingIscsi.fieldset_extent_options,
      label: true,
      class: 'options',
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'insecure_tpc',
          placeholder: helptextSharingIscsi.extent_placeholder_insecure_tpc,
          tooltip: helptextSharingIscsi.extent_tooltip_insecure_tpc,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'xen',
          placeholder: helptextSharingIscsi.extent_placeholder_xen,
          tooltip: helptextSharingIscsi.extent_tooltip_xen,
        },
        {
          type: 'select',
          name: 'rpm',
          placeholder: helptextSharingIscsi.extent_placeholder_rpm,
          tooltip: helptextSharingIscsi.extent_tooltip_rpm,
          options: [
            {
              label: 'UNKNOWN',
              value: 'UNKNOWN',
            },
            {
              label: 'SSD',
              value: 'SSD',
            },
            {
              label: '5400',
              value: '5400',
            },
            {
              label: '7200',
              value: '7200',
            },
            {
              label: '10000',
              value: '10000',
            },
            {
              label: '15000',
              value: '15000',
            },
          ],
          value: 'SSD',
        },
        {
          type: 'checkbox',
          name: 'ro',
          placeholder: helptextSharingIscsi.extent_placeholder_ro,
          tooltip: helptextSharingIscsi.extent_tooltip_ro,
        },
      ],
    },
  ];

  protected deviceFieldGroup = [
    'disk',
  ];
  protected fileFieldGroup = [
    'path',
    'filesize',
  ];
  protected extentTypeControl: AbstractControl;
  protected extentDiskControl: AbstractControl;
  pk: string;
  protected availableThresholdField: FieldConfig;
  fieldConfig: FieldConfig[];

  constructor(
    protected router: Router,
    protected aroute: ActivatedRoute,
    protected iscsiService: IscsiService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected storageService: StorageService,
    private translate: TranslateService,
  ) {}

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      // removed serial field in edit mode
      if (!params['pk']) {
        this.isNew = true;
        const extentTypeFieldset = _.find(this.fieldSets, { class: 'type' });
        extentTypeFieldset.config = _.filter(extentTypeFieldset.config, (item) => item.name !== 'serial');
      } else {
        this.isNew = false;
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;
    const extentDiskField = _.find(this.fieldConfig, { name: 'disk' }) as FormSelectConfig;
    // get device options
    this.loader.open(this.translate.instant('Loading devices. Please wait.'));
    this.iscsiService.getExtentDevices().pipe(untilDestroyed(this)).subscribe((res) => {
      this.loader.close();
      const options = [];
      for (const i in res) {
        options.push({ label: res[i], value: i });
      }
      extentDiskField.options = _.sortBy(options, ['label']);
    });

    this.extentTypeControl = entityForm.formGroup.controls['type'];
    this.extentTypeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      this.formUpdate(value);
    });

    this.availableThresholdField = _.find(this.fieldConfig, { name: 'avail_threshold' });
    this.extentDiskControl = entityForm.formGroup.controls['disk'];
    this.extentDiskControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      // zvol
      if (_.startsWith(value, 'zvol')) {
        this.availableThresholdField.isHidden = false;
      } else {
        this.availableThresholdField.isHidden = true;
        if (this.pk && value != undefined && _.find(extentDiskField.options, { value }) === undefined) {
          extentDiskField.options.push({ label: value, value });
        }
      }
    });

    if (this.isNew) {
      this.extentTypeControl.setValue('DISK');
    }
  }

  formUpdate(type: string): void {
    const isDevice = type != 'FILE';

    this.fileFieldGroup.forEach((field) => {
      const control = _.find(this.fieldConfig, { name: field });
      control['isHidden'] = isDevice;
      control.disabled = isDevice;
      if (isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });

    this.deviceFieldGroup.forEach((field) => {
      const control = _.find(this.fieldConfig, { name: field });
      control['isHidden'] = !isDevice;
      control.disabled = !isDevice;
      if (!isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });
  }

  resourceTransformIncomingRestData(data: IscsiExtent): any {
    this.originalFilesize = parseInt(data.filesize, 10);
    const transformed: any = { ...data };
    if (data.type == IscsiExtentType.Disk) {
      if (_.startsWith(data.path, 'zvol')) {
        transformed['disk'] = data.path;
      }
      delete transformed['path'];
    }
    if (data.filesize && data.filesize !== '0') {
      transformed.filesize = this.storageService.convertBytestoHumanReadable(this.originalFilesize);
    }
    return transformed;
  }

  customEditCall(value: any): void {
    this.loader.open();
    if (value['type'] == 'DISK') {
      value['path'] = value['disk'];
    }
    this.ws.call(this.editCall, [parseInt(this.pk, 10), value]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWsError(this.entityForm, res);
      },
    );
  }

  beforeSubmit(data: any): void {
    data.filesize = this.storageService.convertHumanStringToNum(data.filesize, true);
    if (this.pk === undefined || this.originalFilesize !== data.filesize) {
      data.filesize = data.filesize == 0
        ? data.filesize
        : (data.filesize + (data.blocksize - data.filesize % data.blocksize));
    }
  }

  blurFilesize(): void {
    if (this.entityForm) {
      this.entityForm.formGroup.controls['filesize'].setValue(this.storageService.humanReadable);
    }
  }
}
