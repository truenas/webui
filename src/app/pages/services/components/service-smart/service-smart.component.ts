import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';

import { EntityConfigComponent } from '../../../common/entity/entity-config/';
import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService, SystemGeneralService} from '../../../../services/';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component ({
    selector: 'smart-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceSMARTComponent {

  protected resource_name: string = 'services/smart';
  protected route_success: string[] = ['services'];
  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'smart_interval',
        placeholder: 'Check Interval',
    },
    {
        type: 'select',
        name: 'smart_powermode',
        placeholder: 'Power Mode',
        options: [
        { label: 'Never', value: 'never'},
        { label: 'Sleep', value: 'sleep'},
        { label: 'Standby', value: 'standby'},
        { label: 'Idle', value: 'idle'},
      ]
    },
    {
        type: 'input',
        name: 'smart_difference',
        placeholder: 'Difference',
    },
    {
        type: 'input',
        name: 'smart_informational',
        placeholder: 'Informational',
    },
    {
        type: 'input',
        name: 'smart_critical',
        placeholder: 'Critical',
    },
    {
        type: 'input',
        name: 'smart_email',
        placeholder: 'Email',
    },
  ];
  
  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState) {
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}



