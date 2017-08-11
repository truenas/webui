import {Component, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-smb-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class SMBFormComponent {

  protected resource_name: string = 'sharing/cifs/';
  protected route_success: string[] = [ 'sharing', 'smb' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'cifs_name',
      placeholder: 'Name',
    },
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'cifs_path',
      placeholder: 'Path',
    },
    {
      type: 'select',
      name: 'cifs_vfsobjects',
      placeholder: 'VFS Objects',
      options: [],
      multiple: true,
    },
  ];

  private cifs_vfsobjects: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected _state: GlobalState) {}

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
    }
  }
}
