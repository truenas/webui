import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, UserService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'dc-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
    providers: [UserService]
})

export class ServiceDCComponent {
  protected resource_name: string = 'services/domaincontroller';
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



  private guestList: DynamicSelectModel<string>;
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected userService: UserService) {

  }

  afterInit(entityEdit: any) {
  }

}



