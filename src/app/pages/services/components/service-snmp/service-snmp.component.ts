import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import {  DynamicFormControlModel,
          DynamicFormArrayGroupModel, 
          DynamicFormService, 
          DynamicCheckboxModel, 
          DynamicCheckboxGroupModel,
          DynamicInputModel,
          DynamicSelectModel,
          DynamicRadioGroupModel,
          DynamicTextAreaModel,
          DynamicFormArrayModel,
          DynamicFormGroupModel
} from '@ng2-dynamic-forms/core';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, IscsiService, IdmapService } from '../../../../services/';
import { FormGroup, FormArray } from '@angular/forms';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component ({
    selector: 'snmp-edit',
    template: ` <entity-form [conf]="this"></entity-form>`,
    providers: [IscsiService, IdmapService],
})

export class ServiceSNMPComponent {
  protected resource_name: string = 'services/snmp';
  protected route_success: string[] = ['services','snmp'];
  private entityEdit: EntityConfigComponent;
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'snmp_location',
      placeholder: 'Location',
      label: 'Location'
    },
    {
      type: 'input',
      name: 'snmp_contact',
      placeholder: 'Contact',
    },
    {
      type: 'input',
      name: 'snmp_community',
      placeholder: 'Community',
    },
    {
      type: 'checkbox',
      name: 'snmp_traps',
      label: 'SNMP v3 Support'
    },
    {
      type: 'textarea',
      name: 'snmp_options',
      placeholder: 'Auxiliary Parameters'
    },
    {
      type: 'input',
      name: 'snmp_v3_password',
      disabled: true,
      inputType: 'password',
    }
  ];

  ngOnInit() {
  }

  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,  protected ws: WebSocketService,  protected _injector: Injector, protected _appRef: ApplicationRef,   protected _state: GlobalState, protected iscsiService: IscsiService, protected idmapService: IdmapService) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}