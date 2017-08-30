import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService } from '../../../../../services/';

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
      placeholder : 'Extent name',
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_type',
      placeholder: 'Extent type',
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
      placeholder: 'Device',
      options: [],
    },
    {
      type : 'input',
      name : 'iscsi_target_extent_serial',
      placeholder : 'Serial',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'iscsi_target_extent_path',
      placeholder: 'Path to the extent',
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_filesize',
      placeholder: 'Extent size',
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_blocksize',
      placeholder: 'Logical block size',
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
      placeholder: 'Disable physical block size reporting',
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_avail_threshold',
      placeholder: 'Available space threshold (%)',
    },
    {
      type : 'input',
      name : 'iscsi_target_extent_comment',
      placeholder : 'Comment',
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_insecure_tpc',
      placeholder: 'Enable TPC',
      value: true,
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_xen',
      placeholder: 'Xen initiator compat mode',
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_rpm',
      placeholder: 'LUN RPM',
      options: [],
      value: 'SSD',
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_ro',
      placeholder: 'Read-only',
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

  constructor(protected router: Router, 
              protected aroute: ActivatedRoute,
              protected iscsiService: IscsiService) {}

  preInit() {
    this.sub = this.aroute.params.subscribe(params => {
      // removed serial field in edit mode
      if (!params['pk']) {
        this.isNew = true;
        this.fieldConfig = _.filter(this.fieldConfig, function(item) {
          return item.name != 'iscsi_target_extent_serial';
        });
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
      let control = _.find(this.fieldConfig, {'name': field});
      control.isHidden = isDevice;
    });

    this.deviceFieldGroup.forEach(field => {
      let control = _.find(this.fieldConfig, {'name': field});
      control.isHidden = !isDevice;
    });
  }
}
