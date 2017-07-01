import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {MdInputModule} from '@angular/material';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {EntityConfigComponent} from '../../common/entity/entity-config/';
import {EntityFormComponent} from '../../common/entity/entity-form';
import {FieldConfig} from '../../common/entity/entity-form/models/field-config.interface';
import {matchOtherValidator} from '../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'nt4',
  template : ` <entity-form [conf]="this"></entity-form>`,
})

export class NT4Component {
  protected resource_name: string = 'directoryservice/nis/';
  private entityEdit: EntityConfigComponent;
  protected isBasicMode: boolean = true;
  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'nt4_dcname',
      placeholder : 'Domain Contoller',
    },
    {
      type : 'input',
      name : 'nt4_workgroup',
      placeholder : 'Workgroup Name',
    },
    {
      type : 'input',
      name : 'nt4_adminname',
      placeholder : 'Administrator Name',
    },
    {
      type : 'input',
      name : 'nt4_adminpw',
      placeholder : 'Administrator Password',
      inputType : 'password',
      validation : [ matchOtherValidator('nt4_conf_adminpw') ]
    },
    {
      type : 'input',
      name : 'nt4_conf_adminpw',
      placeholder : 'Confirm Administrator Password',
      inputType : 'password',
    },
    {
      type : 'checkbox',
      name : 'nt4_enable',
      placeholder : 'Enable',
    },
    {
      type : 'checkbox',
      name : 'nt4_default_domain',
      placeholder : 'Use Default Domain',
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

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected systemGeneralService: SystemGeneralService) {}

  afterInit(entityEdit: any) { this.entityEdit = entityEdit; }
}
