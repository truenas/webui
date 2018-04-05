import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, RestService } from '../../../../../services/';
import { T } from '../../../../../translate-marker';
import {Validators} from '@angular/forms';

@Component({
  selector: 'app-iscsi-initiator-form',
  template: `<entity-form [conf]="this"></entity-form>`,
  providers: [ IscsiService ],
})
export class ExtentFormComponent {

  protected resource_name: string = 'services/iscsi/extent';
  protected route_success: string[] = [ 'sharing', 'iscsi', 'extent' ];
  protected isEntity: boolean = true;
  protected entityForm: EntityFormComponent;
  protected isNew: boolean = false;
  public sub: Subscription;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'iscsi_target_extent_name',
      placeholder : T('Extent name'),
      tooltip: T('Name of Extent. If the <b>Extent size</b> is not\
 <i>0</i>, it cannot be an existing file within the voulme/dataset.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_type',
      placeholder: T('Extent type'),
      tooltip: T('Select from <i>File</i> or <i>Device</i>.'),
      options: [
        {
          label: 'Device',
          value: 'Disk',
        },
        {
          label: 'File',
          value: 'File',
        },
      ],
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_disk',
      placeholder: T('Device'),
      tooltip: T('Only appears if <i>Device</i> is selected. Select the\
 unformatted disk, controller, zvol snapshot, or HAST device.'),
      options: [],
      isHidden: false,
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'iscsi_target_extent_serial',
      placeholder : T('Serial'),
      tooltip: T('Unique LUN ID. The default is generated from the MAC\
 address of the system.'),
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'iscsi_target_extent_path',
      placeholder: T('Path to the extent'),
      tooltip: T('Browse to an existing file and use <i>0</i> as the\
 <b>Extent size</b>, or browse to the volume or dataset, click\
 <b>Close</b>, append the\ <b>Extent Name</b> to the path, and specify\
 a value in <b>Extent Size</b>. Extents cannot be created inside the\
 jail root directory.'),
      isHidden: false,
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_filesize',
      placeholder: T('Extent size'),
      tooltip: T('If the size is specified as <i>0</i>, the file must\
 already exist and the actual file size will be used. Otherwise,\
 specify the size of the file to create.'),
      isHidden: false,
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_blocksize',
      placeholder: T('Logical block size'),
      tooltip: T('Only override the defualt if the initiator requires a\
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
      name: 'iscsi_target_extent_pblocksize',
      placeholder: T('Disable physical block size reporting'),
      tooltip: T('If the initiator does not support physical block size\
 values over 4K (MS SQL), check this box.'),
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_avail_threshold',
      placeholder: T('Available space threshold (%)'),
      tooltip: T('Only appears if <i>File</i> or a zvol is selected. When\
 the specified percentage of free space is reached, the system issues\
 an alert. See <a href="http://doc.freenas.org/11/vaai.html#vaai"\
 target="_blank">VAAI</a> Threshold Warning.'),
    },
    {
      type : 'input',
      name : 'iscsi_target_extent_comment',
      placeholder : T('Comment'),
      tooltip: T('Optional.'),
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_insecure_tpc',
      placeholder: T('Enable TPC'),
      tooltip: T('If checked, an initiator can bypass normal access\
 control and access any scannable target. This allows <b>xcopy</b>\
 operations which are otherwise blocked by access control.'),
      value: true,
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_xen',
      placeholder: T('Xen initiator compat mode'),
      tooltip: T('Check this box when using Xen as the iSCSI initiator.'),
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_rpm',
      placeholder: T('LUN RPM'),
      tooltip: T('Do <b>NOT</b> change this setting when using Windows\
 as the initiator. Only needs to be changed in large environments\
 where the number of systems using a specific RPM is needed for\
 accurate reporting statistics.'),
      options: [],
      value: 'SSD',
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_ro',
      placeholder: T('Read-only'),
      tooltip: T('Check this box to prevent the initiator from\
 initializing this LUN.'),
    },
  ];

  protected rpm_control: any;
  protected deviceFieldGroup: any[] = [
    'iscsi_target_extent_disk',
  ];
  protected fileFieldGroup: any[] = [
    'iscsi_target_extent_path',
    'iscsi_target_extent_filesize',
  ];
  protected extent_type_control: any;
  protected extent_disk_control: any;
  protected pk: string;

  constructor(protected router: Router, 
              protected aroute: ActivatedRoute,
              protected iscsiService: IscsiService,
              protected rest: RestService) {}

  preInit() {
    this.sub = this.aroute.params.subscribe(params => {
      // removed serial field in edit mode
      if (!params['pk']) {
        this.isNew = true;
        this.fieldConfig = _.filter(this.fieldConfig, function(item) {
          return item.name != 'iscsi_target_extent_serial';
        });
      } else {
        this.isNew = false;
        this.pk = params['pk'];
      }
    });
  }

  afterInit(entityForm: any) {
    this.entityForm = entityForm;

    this.rpm_control = _.find(this.fieldConfig, {'name' : 'iscsi_target_extent_rpm'});
    this.iscsiService.getRPMChoices().subscribe((res) => {
      res.forEach((item) => {
        this.rpm_control.options.push({label : item[1], value : item[0]});
      });
    });

    this.extent_disk_control = _.find(this.fieldConfig, {'name' : 'iscsi_target_extent_disk'});
    //get all zvols
    this.iscsiService.getVolumes().subscribe((res) => {
      res.data.forEach((vol) => {
        this.iscsiService.getZvols(vol.name).subscribe((res) => {
          res.data.forEach((zvol) => {
            let value = 'zvol/' + vol.name + '/' + zvol.name;
            this.extent_disk_control.options.push({label: value, value: value});
          });
        });
      })
    });
    //get all unused disks
    this.iscsiService.getUnusedDisk().subscribe((res) => {
      for(let i = 0; i < res.length; i++) {
        let label = res[i].name + ' (' +  (<any>window).filesize(res[i].size, {standard : "iec"}) + ')';
        this.extent_disk_control.options.push({label: label, value: res[i].name});
      }
    })
    //show current value if isNew is false
    if (!this.isNew) {
      this.rest.get('/services/iscsi/extent/'+this.pk, {}).subscribe((res) =>{
        if (res.data) {
          this.extent_disk_control.options.push({label: res.data.iscsi_target_extent_path.substring(5), value: res.data.iscsi_target_extent_path.substring(5)});
          this.entityForm.formGroup.controls['iscsi_target_extent_disk'].setValue(res.data.iscsi_target_extent_path.substring(5));
        }
      })
    }
    this.extent_type_control = entityForm.formGroup.controls['iscsi_target_extent_type'];
    this.extent_type_control.valueChanges.subscribe((value) => {
      this.formUpdate(value);
    });

    if (this.isNew) {
      this.extent_type_control.setValue('Disk');
    }
  }

  formUpdate (type) {
    let isDevice = type == 'File' ? false : true;
    
    //resetValue if editing zvol extent
    if (type == 'ZVOL') {
      this.extent_type_control.setValue('Disk');
      let disk_path = this.entityForm.data['iscsi_target_extent_path'];
      let disk_control = this.entityForm.formGroup.controls['iscsi_target_extent_disk'];
      //remove '/dev/' from path
      disk_path = disk_path.substring(5);
      disk_control.setValue(disk_path);
    }

    this.fileFieldGroup.forEach(field => {
      let control: any = _.find(this.fieldConfig, {'name': field});
      control.isHidden = isDevice;
    });

    this.deviceFieldGroup.forEach(field => {
      let control: any = _.find(this.fieldConfig, {'name': field});
      control.isHidden = !isDevice;
    });
  }
}
