import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'afp-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class ServiceAFPComponent {
  protected resource_name: string = 'services/ssh';
  protected isBasicMode: boolean = true;
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicCheckboxModel({
      id: 'afp_srv_guest',
      label: 'Guest Access',
    }),
    new DynamicSelectModel({
      id: 'afp_srv_guest_user',
      label: 'Guest Account',
    }),
    new DynamicInputModel({
        id: 'afp_srv_connections_limit',
        label: 'Max. Connections',
    }),
    new DynamicCheckboxModel({
      id: 'afp_srv_homedir_enable',
      label: 'Enable home directories',
    }),
   new DynamicInputModel({
      id: 'afp_srv_homedir',
      label: 'Home Directories',
    }),
    new DynamicInputModel({
      id: 'afp_srv_homename',
      label: 'Home share name',
    }),
   new DynamicInputModel({
      id: 'afp_srv_dbpath',
      label: 'Database Path',
    }),
   new DynamicTextAreaModel({
      id: 'afp_srv_global_aux',
      label: 'Global auxiliary parameters',
    }),
    new DynamicSelectModel({
        id: 'afp_srv_chmod_request',
        label: 'Chmod Request',
        options: [
          { label: 'Ignore', value: 'ignore' },
          { label: 'Preserve', value: 'preserve' },
          { label: 'Simple', value: 'simple' },
        ],
    }),
    new DynamicSelectModel({
        id: 'afp_srv_map_acls',
        label: 'Map ACLs',
        options: [
          { label: 'Rights', value: 'rights' },
          { label: 'None', value: 'none' },
          { label: 'Mode', value: 'mode' },
        ],
    }),
    new DynamicInputModel({
        id: 'afp_srv_bindip',
        label: 'Bind Interfaces',
    }),
  ];
protected advanced_field: Array<any> = [
    'ssh_bindiface',
    'ssh_kerberosauth',
    'ssh_sftp_log_level',
    'ssh_sftp_log_facility',
    'ssh_options', 
  ];

  isCustActionVisible(actionId: string) {
    if (actionId == 'advanced_mode' && this.isBasicMode == false) {
      return false;
    } else if (actionId == 'basic_mode' && this.isBasicMode == true) {
      return false;
    } 
    return true;
  }

  protected custActions: Array<any> = [
    {
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => {
        this.isBasicMode = !this.isBasicMode;
      }
    }
  ];
 constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



