import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'ssh-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class ServiceSSHComponent {
  // Form Layout
  protected resource_name: string = 'services/ssh';
  private entityEdit: EntityConfigComponent;

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
        id: 'ssh_tcpport',
        label: 'TCP Port',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_rootlogin',
      label: 'Login as Root with password',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_passwordauth',
      label: 'Allow Password Authentication',
    }),
      new DynamicCheckboxModel({
      id: 'ssh_tcpfwd',
      label: 'Allow TCP Port Forwarding',
    }),
    new DynamicCheckboxModel({
      id: 'ssh_compression',
      label: 'Compress Connections',
    }),
  ];

 constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



