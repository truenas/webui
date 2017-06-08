import {  ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EntityConfigComponent } from '../../common/entity/entity-config/';
import { GlobalState } from '../../../global.state';
import { RestService, WebSocketService, SystemGeneralService } from '../../../services/';
import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

import { Subscription } from 'rxjs';

@Component ({
    selector: 'nt4',
    template: ` <entity-form [conf]="this"></entity-form>`,
})

export class NT4Component {
  protected resource_name: string = 'directoryservice/nis/';
  private entityEdit: EntityConfigComponent;
  protected isBasicMode: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'nt4_dcname',
      label: 'Domain Contoller',
    },
    {
      type: 'input',
      name: 'nt4_workgroup',
      label: 'Workgroup Name',
    },
    {
      type: 'input',
      name: 'nt4_adminname',
      label: 'Administrator Name',
    },
    {
      type: 'input',
      name: 'nt4_adminpw',
      label: 'Administrator Password',
    },
    {
      type: 'input',
      name: 'nt4_conf_adminpw',
      label: 'Confirm Administrator Password',
    },
    {
      type: 'checkbox',
      name: 'nt4_enable',
      label: 'Enable',
    },
    {
      type: 'checkbox',
      name: 'nt4_default_domain',
      label: 'Use Default Domain',
    },
  ];

  protected advanced_field: Array<any> = [
    'nt4_default_domain',
  ];

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
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



  constructor(protected router: Router, protected route: ActivatedRoute, protected rest: RestService,
              protected ws: WebSocketService,protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState, protected systemGeneralService: SystemGeneralService) {

              }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



