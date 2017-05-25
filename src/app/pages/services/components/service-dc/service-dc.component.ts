import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { DynamicFormControlModel, DynamicFormService, DynamicCheckboxModel, DynamicInputModel,    DynamicSelectModel,DynamicTextAreaModel, } from '@ng2-dynamic-forms/core';


import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService } from '../../../../services/';
import { NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

import { Subscription } from 'rxjs';


@Component ({
    selector: 'domaincontroller-edit',
    template: ` <entity-config [conf]="this"></entity-config>`
})

export class ServiceDCComponent {
  protected resource_name: string = 'services/domaincontroller';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'dc_realm',
      label: 'Realm',
    }),
    new DynamicInputModel({
      id: 'dc_domain',
      label: 'Domain',
    }),
    new DynamicSelectModel({
        id: 'dc_role',
        label: 'Server Roll',
        options: [
          { label: 'DC', value: 'dc' },
        ]
    }),
    new DynamicInputModel({
      id: 'dc_dns_forwarder',
      label: 'DNS Forwarder',
    }),
   new DynamicSelectModel({
      id: 'dc_forest_level',
      label: 'Forest Level',
      options: [
        { label: '2000', value: '2000' },
        { label: '2003', value: '2003' },
        { label: '2008', value: '2008' },
        { label: '2008_R2', value: '2008_R2' },
      ]
    }),
    new DynamicInputModel({
      id: 'dc_passwd',
      inputType: 'password',
      label: 'Administration Password',
      validators: {
          required: null,
          minLength: 3
      }
    }),
    new DynamicInputModel({
      id: 'confirmPassword',
      inputType: 'password',
      label: 'Confirm Administration Password',
      relation: [
        {
          action: "DISABLE",
          connective: "AND",
          when: [
            {
              id: "dc_passwd",
              value: null
            },
          ]
        }
      ]
    }),
    new DynamicSelectModel({
        id: 'afp_srv_map_acls',
        label: 'Kerberos Realm:',
        options: [
          { label: 'Rights', value: 'rights' },
          { label: 'None', value: 'none' },
          { label: 'Mode', value: 'mode' },
        ],
    }),

  ];
  
  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService, protected formService: DynamicFormService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState) {

  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



