import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import * as _ from 'lodash';

import { EntityFormComponent } from '../../../../common/entity/entity-form';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';
import { IscsiService, RestService } from '../../../../../services/';
import { helptext_sharing_iscsi } from 'app/helptext/sharing';

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
      placeholder : helptext_sharing_iscsi.extent_placeholder_name,
      tooltip: helptext_sharing_iscsi.extent_tooltip_name,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_name
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_type',
      placeholder: helptext_sharing_iscsi.extent_placeholder_type,
      tooltip: helptext_sharing_iscsi.extent_tooltip_type,
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
      name : 'iscsi_target_extent_serial',
      placeholder : helptext_sharing_iscsi.extent_placeholder_serial,
      tooltip: helptext_sharing_iscsi.extent_tooltip_serial,
    },
    {
      type : 'explorer',
      explorerType: 'file',
      initial: '/mnt',
      name: 'iscsi_target_extent_path',
      placeholder: helptext_sharing_iscsi.extent_placeholder_path,
      tooltip: helptext_sharing_iscsi.extent_tooltip_path,
      isHidden: false,
      disabled: false,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_path
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_filesize',
      placeholder: helptext_sharing_iscsi.extent_placeholder_filesize,
      tooltip: helptext_sharing_iscsi.extent_tooltip_filesize,
      isHidden: false,
      disabled: false,
      required: true,
      validation : helptext_sharing_iscsi.extent_validators_filesize
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_blocksize',
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
      name: 'iscsi_target_extent_pblocksize',
      placeholder: helptext_sharing_iscsi.extent_placeholder_pblocksize,
      tooltip: helptext_sharing_iscsi.extent_tooltip_pblocksize,
    },
    {
      type: 'input',
      name: 'iscsi_target_extent_avail_threshold',
      placeholder: helptext_sharing_iscsi.extent_placeholder_avail_threshold,
      tooltip: helptext_sharing_iscsi.extent_tooltip_avail_threshold,
    },
    {
      type : 'input',
      name : 'iscsi_target_extent_comment',
      placeholder : helptext_sharing_iscsi.extent_placeholder_comment,
      tooltip: helptext_sharing_iscsi.extent_tooltip_comment,
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_insecure_tpc',
      placeholder: helptext_sharing_iscsi.extent_placeholder_insecure_tpc,
      tooltip: helptext_sharing_iscsi.extent_tooltip_insecure_tpc,
      value: true,
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_xen',
      placeholder: helptext_sharing_iscsi.extent_placeholder_xen,
      tooltip: helptext_sharing_iscsi.extent_tooltip_xen,
    },
    {
      type: 'select',
      name: 'iscsi_target_extent_rpm',
      placeholder: helptext_sharing_iscsi.extent_placeholder_rpm,
      tooltip: helptext_sharing_iscsi.extent_tooltip_rpm,
      options: [],
      value: 'SSD',
    },
    {
      type: 'checkbox',
      name: 'iscsi_target_extent_ro',
      placeholder: helptext_sharing_iscsi.extent_placeholder_ro,
      tooltip: helptext_sharing_iscsi.extent_tooltip_ro,
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
    //get device options
    this.iscsiService.getExtentDevices().subscribe((res) => {
      for(let i in res) {
        this.extent_disk_control.options.push({label: res[i], value: i});
      }
    })
    //show current value if isNew is false
    if (!this.isNew) {
      this.rest.get('/services/iscsi/extent/'+this.pk, {}).subscribe((res) =>{
        if (res.data) {
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
      control.disabled = isDevice;
      if (isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });

    this.deviceFieldGroup.forEach(field => {
      let control: any = _.find(this.fieldConfig, {'name': field});
      control.isHidden = !isDevice;
      control.disabled = !isDevice;
      if (!isDevice) {
        this.entityForm.formGroup.controls[field].disable();
      } else {
        this.entityForm.formGroup.controls[field].enable();
      }
    });
  }
}
