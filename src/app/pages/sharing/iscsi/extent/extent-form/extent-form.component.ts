import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, RestService, WebSocketService } from '../../../../../services/';
import { T } from '../../../../../translate-marker';
import {Validators} from '@angular/forms';
import { EntityUtils } from '../../../../common/entity/utils';
import { AppLoaderService } from '../../../../../services/app-loader/app-loader.service';

@Component({
  selector: 'app-iscsi-initiator-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService ],
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

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'name',
      placeholder : T('Extent name'),
      tooltip: T('Enter the extent name. The name cannot be an existing\
                  file within the pool or dataset when the\
                  <b>Extent size</b> is something other than <i>0</i>.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'type',
      placeholder: T('Extent type'),
      tooltip: T('Select from <i>File</i> or <i>Device</i>.'),
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
      placeholder: T('Device'),
      tooltip: T('Only appears if <i>Device</i> is selected. Select the\
                  unformatted disk, controller, zvol snapshot,\
                  or HAST device.'),
      options: [],
      isHidden: false,
      disabled: false,
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'serial',
      placeholder : T('Serial'),
      tooltip: T('Unique LUN ID. The default is generated\
                  from the MAC address of the system.'),
    },
    {
      type : 'explorer',
      explorerType: 'file',
      initial: '/mnt',
      name: 'path',
      placeholder: T('Path to the extent'),
      tooltip: T('Browse to an existing file and use <i>0</i> as the\
                  <b>Extent size</b>, or browse to the pool or dataset,\
                  click <b>Close</b>, append the <b>Extent Name</b> to\
                  the path, and specify a value in <b>Extent Size</b>.\
                  Extents cannot be created inside the jail\
                  root directory.'),
      isHidden: false,
      disabled: false,
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'filesize',
      placeholder: T('Extent size'),
      tooltip: T('If the size is specified as <i>0</i>, the file must\
                  already exist and the actual file size will be used.\
                  Otherwise, specify the size of the file to create.'),
      isHidden: false,
      disabled: false,
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'blocksize',
      placeholder: T('Logical block size'),
      tooltip: T('Only override the default if the initiator requires a\
                  different block size.'),
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
      placeholder: T('Disable physical block size reporting'),
      tooltip: T('Set if the initiator does not support physical block\
                  size values over 4K (MS SQL).'),
    },
    {
      type: 'input',
      name: 'avail_threshold',
      placeholder: T('Available space threshold (%)'),
      tooltip: T('Only appears if a <i>File</i> or zvol is selected. When\
                  the specified percentage of free space is reached,\
                  the system issues an alert.\
                  See <a href="%%docurl%%/vaai.html%%webversion%%#vaai"\
                  target="_blank">VAAI</a> Threshold Warning.'),
      isHidden: false,
    },
    {
      type : 'input',
      name : 'comment',
      placeholder : T('Comment'),
      tooltip: T('Enter any notes.'),
    },
    {
      type: 'checkbox',
      name: 'insecure_tpc',
      placeholder: T('Enable TPC'),
      tooltip: T('Set to allow an initiator to bypass normal access\
                  control and access any scannable target. This allows\
                  <a\
                  href="https://docs.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2012-R2-and-2012/cc771254(v=ws.11)"\
                  target="_blank">xcopy</a> operations which are\
                  otherwise blocked by access control.'),
      value: true,
    },
    {
      type: 'checkbox',
      name: 'xen',
      placeholder: T('Xen initiator compat mode'),
      tooltip: T('Set when using Xen as the iSCSI initiator.'),
    },
    {
      type: 'select',
      name: 'rpm',
      placeholder: T('LUN RPM'),
      tooltip: T('Do <b>NOT</b> change this setting when using Windows\
                  as the initiator. Only needs to be changed in large\
                  environments where the number of systems using a\
                  specific RPM is needed for accurate reporting\
                  statistics.'),
      options: [],
      value: 'SSD',
    },
    {
      type: 'checkbox',
      name: 'ro',
      placeholder: T('Read-only'),
      tooltip: T('Set to prevent the initiator from initializing this\
                  LUN.'),
    },
  ];

  protected rpm_control: any;
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
              protected loader: AppLoaderService) {}

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
        this.customFilter[0][0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;

    this.rpm_control = _.find(this.fieldConfig, {'name' : 'rpm'});
    this.iscsiService.getRPMChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rpm_control.options.push({label : item[1], value : item[0]});
      });
    });

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
    if (data.type == 'DISK') {
      if (_.startsWith(data['path'], 'zvol')) {
        data['disk'] = data['path'];
      }
      delete data['path'];
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
}
