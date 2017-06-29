import { ApplicationRef, Component, Injector, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormArray, Validators, AbstractControl} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { EntityConfigComponent } from '../../../common/entity/entity-config/';

import { GlobalState } from '../../../../global.state';
import { RestService, WebSocketService} from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ntpserver-add',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class NTPServerAddComponent {

  protected route_success: string[] = ['system', 'ntpservers'];
  protected resource_name: string = 'system/ntpserver';
<<<<<<< HEAD
  public formModel: DynamicFormControlModel[] = [
    new DynamicInputModel({
      id: 'ntp_address',
      label: 'Address',
    }),
    new DynamicCheckboxModel({
      id: 'ntp_burst',
      label: 'Burst',
    }),
    new DynamicCheckboxModel({
      id: 'ntp_iburst',
      label: 'IBurst',
      value: true,
    }),
    new DynamicCheckboxModel({
      id: 'ntp_prefer',
      label: 'Prefer',
    }),
    new DynamicInputModel({
      id: 'ntp_minpoll',
      label: 'Min. Poll',
      value: 6,
    }),
    new DynamicInputModel({
      id: 'ntp_maxpoll',
      label: 'Max. Poll',
      value: 10,
    }),
    new DynamicCheckboxModel({
      id: 'force',
      label: 'Force',
    }),
=======
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'ntp_address',
        placeholder: 'Address',
    },
    {
        type: 'checkbox',
        name: 'ntp_burst',
        placeholder: 'Burst',
    },
    {
        type: 'checkbox',
        name: 'ntp_iburst',
        placeholder: 'IBurst',
    },
    {
        type: 'checkbox',
        name: 'ntp_prefer',
        placeholder: 'Prefer',
    },
    {
        type: 'input',
        name: 'ntp_minpoll',
        placeholder: 'Min. Poll',
        value: 6
    },
    {
        type: 'input',
        name: 'ntp_maxpoll',
        placeholder: 'Max. Poll',
        value: 10,
    },
    {
        type: 'checkbox',
        name: 'force',
        placeholder: 'Force',
    },
>>>>>>> cc462787f7bb9fefc93823f47db32f6623176ade
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState,
  ) {}

  afterInit(entityAdd: any) {
  }

}
