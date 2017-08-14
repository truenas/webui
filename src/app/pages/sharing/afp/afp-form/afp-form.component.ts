import {Component, ViewContainerRef} from '@angular/core';
import {Router} from '@angular/router';

import {GlobalState} from '../../../../global.state';
import {RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-afp-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AFPFormComponent {

  protected route_success: string[] = [ 'sharing', 'afp' ];
  protected resource_name: string = 'sharing/afp/';
  protected isEntity: boolean = true;
  protected isBasicMode: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name: 'afp_path',
      placeholder: 'Path',
    },
    {
      type: 'input',
      name: 'afp_name',
      placeholder: 'Name',
    },
    {
      type: 'input',
      name: 'afp_comment',
      placeholder: 'Comment',
    },
    {
      type: 'input',
      name: 'afp_allow',
      placeholder: 'Allow list',
    },
    {
      type: 'input',
      name: 'afp_deny',
      placeholder: 'Deny list',
    },
    {
      type: 'input',
      name: 'afp_ro',
      placeholder: 'Read Only Access',
    },
    {
      type: 'input',
      name: 'afp_rw',
      placeholder: 'Read/Write Access',
    },
    {
      type: 'checkbox',
      name: 'afp_timemachine',
      placeholder: 'Time Machine',
    },
    {
      type: 'checkbox',
      name: 'afp_nodev',
      placeholder: 'Zero Device Numbers',
    },
    {
      type: 'checkbox',
      name: 'afp_nostat',
      placeholder: 'No Stat',
    },
    {
      type: 'checkbox',
      name: 'afp_upriv',
      placeholder: 'AFP3 Unix Privs',
    },
    {
      type: 'permissions',
      name: 'afp_fperm',
      placeholder: 'Default file permissions',
    },
    {
      type: 'permissions',
      name: 'afp_dperm',
      placeholder: 'Default directory permissions',
    },
    {
      type: 'permissions',
      name: 'afp_umask',
      placeholder: 'Default umask',
    },
    {
      type: 'textarea',
      name: 'afp_hostsallow',
      placeholder: 'Hosts Allow',
    },
    {
      type: 'textarea',
      name: 'afp_hostsdeny',
      placeholder: 'Hosts Deny',
    },
    {
      type: 'textarea',
      name: 'afp_auxparams',
      placeholder: 'Auxiliary Parameters',
    },
  ];

  protected advanced_field: Array<any> = [
    'afp_comment',
    'afp_upriv',
    'afp_auxparams',
    'afp_hostsallow',
    'afp_hostsdeny',
    'afp_umask',
    'afp_dperm',
    'afp_fperm',
    'afp_nostat',
    'afp_nodev',
    'afp_ro',
    'afp_rw',
    'afp_allow',
    'afp_deny',
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
              protected ws: WebSocketService,
              protected _state: GlobalState) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    }
    return true;
  }

  afterInit(entityForm: any) {
    if (entityForm.isNew) {
      entityForm.formGroup.controls['afp_umask'].setValue("000", {emitEvent: true});
      entityForm.formGroup.controls['afp_fperm'].setValue("644", {emitEvent: true});
      entityForm.formGroup.controls['afp_dperm'].setValue("755", {emitEvent: true});
      entityForm.formGroup.controls['afp_upriv'].setValue(true);
    }
  }
}
