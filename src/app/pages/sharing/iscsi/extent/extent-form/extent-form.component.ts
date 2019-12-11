import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormControl, ValidationErrors } from "@angular/forms";
import { Subscription } from 'rxjs/Subscription';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, RestService, WebSocketService, StorageService } from '../../../../../services/';
import { EntityUtils } from '../../../../common/entity/utils';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';
import globalHelptext from 'app/helptext/global-helptext';

@Component({
  selector: 'app-iscsi-initiator-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService, StorageService ],
})
export class ExtentFormComponent {

  protected addCall: string = 'iscsi.extent.create';
  protected queryCall: string = 'iscsi.extent.query';
  protected editCall = 'iscsi.extent.update';
  protected customFilter: Array<any> = [[["id", "="]]];
  // protected resource_name: string = 'services/iscsi/extent';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'extent' ];
  protected isEntity: boolean = true;
  protected entityForm: EntityFormComponent;
  protected isNew: boolean = false;
  public sub: Subscription;
  protected originalFilesize;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      placeholder : helptext_sharing_iscsi.extent_placeholder_name,
      tooltip: helptext_sharing_iscsi.extent_tooltip_name,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_name
    },
    {
      type: 'select',
      name: 'type',
      placeholder: helptext_sharing_iscsi.extent_placeholder_type,
      tooltip: helptext_sharing_iscsi.extent_tooltip_type,
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
      placeholder: helptext_sharing_iscsi.extent_placeholder_disk,
      tooltip: helptext_sharing_iscsi.extent_tooltip_disk,
      options: [],
      isHidden: false,
      disabled: false,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_disk
    },
    {
      type : 'input',
      name : 'serial',
      placeholder : helptext_sharing_iscsi.extent_placeholder_serial,
      tooltip: helptext_sharing_iscsi.extent_tooltip_serial,
    },
    {
      type : 'explorer',
      explorerType: 'file',
      initial: '/mnt',
      name: 'path',
      placeholder: helptext_sharing_iscsi.extent_placeholder_path,
      tooltip: helptext_sharing_iscsi.extent_tooltip_path,
      isHidden: false,
      disabled: false,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_path
    },
    {
      type: 'input',
      name: 'filesize',
      placeholder: helptext_sharing_iscsi.extent_placeholder_filesize,
      tooltip: helptext_sharing_iscsi.extent_tooltip_filesize,
      isHidden: false,
      disabled: false,
      required: true,
      blurEvent:this.blurFilesize,
      blurStatus: true,
      parent: this,
      validation: [Validators.required,
        (control: FormControl): ValidationErrors => {
          const config = this.fieldConfig.find(c => c.name === 'filesize');
          const size = this.storageService.convertHumanStringToNum(control.value, true);

          let errors = control.value && isNaN(size)
            ? { invalid_byte_string: true }
            : null

          if (errors) {
            config.hasErrors = true;
            config.errors = globalHelptext.human_readable.input_error;
          } else {
            config.hasErrors = false;
            config.errors = '';
          }

          return errors;
        }
      ],
    },
    {
      type: 'select',
      name: 'blocksize',
      placeholder: helptext_sharing_iscsi.extent_placeholder_blocksize,
      tooltip: helptext_sharing_iscsi.extent_tooltip_blocksize,
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
      placeholder: helptext_sharing_iscsi.extent_placeholder_pblocksize,
      tooltip: helptext_sharing_iscsi.extent_tooltip_pblocksize,
    },
    {
      type: 'input',
      name: 'avail_threshold',
      placeholder: helptext_sharing_iscsi.extent_placeholder_avail_threshold,
      tooltip: helptext_sharing_iscsi.extent_tooltip_avail_threshold,
      isHidden: false,
    },
    {
      type : 'input',
      name : 'comment',
      placeholder : helptext_sharing_iscsi.extent_placeholder_comment,
      tooltip: helptext_sharing_iscsi.extent_tooltip_comment,
    },
    {
      type: 'checkbox',
      name: 'insecure_tpc',
      placeholder: helptext_sharing_iscsi.extent_placeholder_insecure_tpc,
      tooltip: helptext_sharing_iscsi.extent_tooltip_insecure_tpc,
      value: true,
    },
    {
      type: 'checkbox',
      name: 'xen',
      placeholder: helptext_sharing_iscsi.extent_placeholder_xen,
      tooltip: helptext_sharing_iscsi.extent_tooltip_xen,
    },
    {
      type: 'select',
      name: 'rpm',
      placeholder: helptext_sharing_iscsi.extent_placeholder_rpm,
      tooltip: helptext_sharing_iscsi.extent_tooltip_rpm,
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
      placeholder: helptext_sharing_iscsi.extent_placeholder_ro,
      tooltip: helptext_sharing_iscsi.extent_tooltip_ro,
    },
  ];
  protected deviceFieldGroup: any[] = [
    'disk',
  ];
  protected fileFieldGroup: any[] = [
    'path',
    'filesize',
  ];
  protected extent_type_control: any;
  protected extent_disk_control: any;
  protected pk: string;
  protected avail_threshold_field: any;

  constructor(protected router: Router,
              protected aroute: ActivatedRoute,
              protected iscsiService: IscsiService,
              protected rest: RestService,
              protected ws: WebSocketService,
              protected loader: AppLoaderService,
              protected storageService: StorageService) {}

  preInit() {
    this.sub = this.aroute.params.subscribe(params => {
      // removed serial field in edit mode
      if (!params['pk']) {
        this.isNew = true;
        this.fieldConfig = _.filter(this.fieldConfig, function(item) {
          return item.name != 'serial';
        });
      } else {
        this.isNew = false;
        this.pk = params['pk'];
        this.customFilter[0][0].push(parseInt(params['pk'], 10));
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;
    let extent_disk_field = _.find(this.fieldConfig, {'name' : 'disk'});
    //get device options
    this.iscsiService.getExtentDevices().subscribe((res) => {
      for(let i in res) {
        extent_disk_field.options.push({label: res[i], value: i});
      }
    })

    this.extent_type_control = entityForm.formGroup.controls['type'];
    this.extent_type_control.valueChanges.subscribe((value) => {
      this.formUpdate(value);
    });

    this.avail_threshold_field = _.find(this.fieldConfig, {'name': 'avail_threshold'});
    this.extent_disk_control = entityForm.formGroup.controls['disk'];
    this.extent_disk_control.valueChanges.subscribe((value) => {
      // zvol
      if (_.startsWith(value, 'zvol')) {
        this.avail_threshold_field.isHidden = false;
      } else {
        this.avail_threshold_field.isHidden = true;
        if (this.pk && value != undefined && _.find(extent_disk_field.options, {value: value}) === undefined) {
          extent_disk_field.options.push({label: value, value: value});
        }
      }
    });

    if (this.isNew) {
      this.extent_type_control.setValue('DISK');
    }
  }

  formUpdate (type) {
    const isDevice = type == 'FILE' ? false : true;

    this.fileFieldGroup.forEach(field => {
      const control: any = _.find(this.fieldConfig, {'name': field});
      control['isHidden'] = isDevice;
      control.disabled = isDevice;
      if (isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });

    this.deviceFieldGroup.forEach(field => {
      const control: any = _.find(this.fieldConfig, {'name': field});
      control['isHidden'] = !isDevice;
      control.disabled = !isDevice;
      if (!isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });
  }

  resourceTransformIncomingRestData(data) {
    this.originalFilesize = parseInt(data.filesize, 10);
    if (data.type == 'DISK') {
      if (_.startsWith(data['path'], 'zvol')) {
        data['disk'] = data['path'];
      }
      delete data['path'];
    }
    if (data.filesize && data.filesize !== '0') {
      data.filesize = this.storageService.convertBytestoHumanReadable(data.filesize);
    }
    return data;
  }

  customEditCall(value) {
    this.loader.open();
    if (value['type'] == 'DISK') {
      value['path'] = value['disk'];
    }
    this.ws.call(this.editCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this.entityForm, res);
      }
    );

  }

  beforeSubmit(data) {
    data.filesize = this.storageService.convertHumanStringToNum(data.filesize, true);
    if (this.pk === undefined || this.originalFilesize !== data.filesize) {
      data.filesize = data.filesize == 0 ? data.filesize : (data.filesize + (data.blocksize - data.filesize%data.blocksize));
    }
  }

  blurFilesize(parent){
    if (parent.entityForm) {
        parent.entityForm.formGroup.controls['filesize'].setValue(parent.storageService.humanReadable);
    }
  }
}
