import { Component, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-smb-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class SMBFormComponent {

  protected resource_name: string = 'sharing/cifs/';
  protected route_success: string[] = [ 'sharing', 'smb' ];
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'cifs_path',
      placeholder: 'Path',
    },
    {
      type: 'input',
      name: 'cifs_name',
      placeholder: 'Name',
    },
    {
      type: 'checkbox',
      name: 'cifs_default_permissions',
      placeholder: 'Default Permissions',
    },
    {
      type: 'checkbox',
      name: 'cifs_ro',
      placeholder: 'Export Read Only',
    },
    {
      type: 'checkbox',
      name: 'cifs_browsable',
      placeholder: 'Browsable to Network Clients',
    },
    {
      type: 'checkbox',
      name: 'cifs_recyclebin',
      placeholder: 'Export Recycle Bin',
    },
    {
      type: 'checkbox',
      name: 'cifs_showhiddenfiles',
      placeholder: 'Show Hidden Files',
    },
    {
      type: 'checkbox',
      name: 'cifs_guestok',
      placeholder: 'Allow Guest Access',
    },
    {
      type: 'checkbox',
      name: 'cifs_guestonly',
      placeholder: 'Only Allow Guest Access',
    },
    {
      type: 'textarea',
      name: 'cifs_hostsallow',
      placeholder: 'Hosts Allow',
    },
    {
      type: 'textarea',
      name: 'cifs_hostsdeny',
      placeholder: 'Hosts Deny',
    },
    {
      type: 'select',
      name: 'cifs_vfsobjects',
      placeholder: 'VFS Objects',
      options: [],
      multiple: true,
    },
   // Uncomment when this is documented and testable
   // {
   //   type: 'select',
   //   name: 'cifs_',
   //   placeholder: 'Periodic Snapshot Task',
   //   options: []
   // },
    {
      type: 'textarea',
      name: 'cifs_auxsmbconf',
      placeholder: 'Auxiliary Parameters',
    },
  ];

  private cifs_vfsobjects: any;

  protected advanced_field: Array<any> = [
    'cifs_auxsmbconf',
    'cifs_vfsobjects',
    'cifs_hostsdeny',
    'cifs_hostsallow',
    'cifs_guestonly',
    'cifs_showhiddenfiles',
    'cifs_recyclebin',
    'cifs_browsable',
    'cifs_ro',
  ];

  public custActions: Array<any> = [
    {
      id : 'basic_mode',
      name : 'Basic Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id' : 'advanced_mode',
      name : 'Advanced Mode',
      function : () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  afterInit(entityForm: any) {
    entityForm.ws.call('notifier.choices', [ 'CIFS_VFS_OBJECTS' ])
        .subscribe((res) => {
          this.cifs_vfsobjects =
              _.find(this.fieldConfig, {'name': "cifs_vfsobjects"});
          res.forEach((item) => {
            this.cifs_vfsobjects.options.push({label : item[1], value : item[0]});
          });
        });
    if (entityForm.isNew) {
      entityForm.formGroup.controls['cifs_vfsobjects'].setValue(['zfs_space','zfsacl','streams_xattr','aio_pthread']);
      entityForm.formGroup.controls['cifs_default_permissions'].setValue(true);
      entityForm.formGroup.controls['cifs_browsable'].setValue(true);
    }
  }
}
