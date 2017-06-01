import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';


@Component ({
    selector: 'ups-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceUPSComponent {
  protected resource_name: string = 'services/ups';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services','ups'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicSelectModel({
      id: 'ups_mode',
      label: 'UPS Mode',
      options: [
        { label: 'Master', value: 'master'},
        { label: 'Slave', value: 'slave'},
      ]
    }),
    new DynamicInputModel({
      id: 'ups_identifier',
      label: 'Identifier',
    }),
    new DynamicSelectModel({
      id: 'ups_driver',
      label: 'Driver',
    }),
    new DynamicSelectModel({
      id: 'ups_port',
      label: 'Port',
    }),
    new DynamicTextAreaModel({
      id: 'lldp_intdesc',
      label: 'Auxiliary Parameters(ups.conf)',
    }),
    new DynamicTextAreaModel({
      id: 'lldp_intdesc',
      label: 'Auxiliary Parameters(upsd.conf)',
    }),
    new DynamicInputModel({
      id: 'ups_description',
      label: 'Description',
    }),
    new DynamicSelectModel({
      id: 'ups_shutdown',
      label: 'Shutdown Mode',
      options: [
        { label: 'UPS reaches low battery', value: 'lowbatt'},
        { label: 'UPS goes on battery', value: 'batt'},
      ]
    }),
    new DynamicInputModel({
      id: 'ups_shutdowntimer',
      label: 'Shutdown Timer',
    }),
    new DynamicInputModel({
      id: 'ups_shutdowncmd',
      label: 'Shutdown Command',
    }),
    new DynamicInputModel({
      id: 'ups_monuser',
      label: 'Monitor User',
    }),
    new DynamicInputModel({
      id: 'ups_monpwd',
      label: 'Monitor Password',
    }),
    new DynamicTextAreaModel({
      id: 'ups_extrausers',
      label: 'Extra Users(upsd.conf)',
    }),
    new DynamicCheckboxModel({
      id: 'ups_rmonitor',
      label: 'Remote Monitor',
    }),
    new DynamicCheckboxModel({
      id: 'ups_emailnotify',
      label: 'Send Email Status Updates',
    }),
    new DynamicInputModel({
      id: 'ups_toemail',
      label: 'To Email',
    }),
    new DynamicInputModel({
      id: 'ups_subject',
      label: 'Email Subject',
    }),
    new DynamicCheckboxModel({
      id: 'ups_powerdown',
      label: 'Power Off UPS',
    }),
  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}