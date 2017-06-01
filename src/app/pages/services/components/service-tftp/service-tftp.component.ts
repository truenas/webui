import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import * as _ from 'lodash';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'tftp-edit',
    template: ` <entity-config [conf]="this"></entity-config>`,
})

export class ServiceTFTPComponent {
  // Form Layout
  protected resource_name: string = 'services/tftp';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services', 'tftp'];

  protected formModel: DynamicFormControlModel[] = [
      new DynamicInputModel({
        id: 'tftp_directory',
        label: 'Directory',
    }),
    new DynamicCheckboxModel({
      id: 'tftp_newfiles',
      label: 'Allow New Files',
    }),
    new DynamicInputModel({
      id: 'tftp_port',
      label: 'Port',
    }),
    new DynamicSelectModel({
      id: 'tftp_username',
      label: 'Username',
      options: [
        { label: '', value: ''},
        { label: 'null', value: ''},
      ]
    }),
    new DynamicInputModel({
      id: 'tftp_umask',
      label: 'Umask',
    }),
    new DynamicTextAreaModel({
        id: 'tftp_options',
        label: 'Extra options',
    }),
  ];

 constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



