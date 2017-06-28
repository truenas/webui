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
    selector: 'ups-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceUPSComponent {
  protected resource_name: string = 'services/ups';
  protected route_success: string[] = ['services'];
  private entityEdit: EntityConfigComponent;

  public fieldConfig: FieldConfig[] = [
    {
        type: 'select',
        name: 'ups_mode',
        placeholder: 'UPS Mode',
        options: [
          { label: 'Master', value: 'master'},
          { label: 'Slave', value: 'slave'},
        ]
    },
    {
        type: 'input',
        name: 'ups_identifier',
        placeholder: 'Identifier',
    },
    {
        type: 'select',
        name: 'ups_driver',
        placeholder: 'Driver',
    },
    {
        type: 'select',
        name: 'ups_port',
        placeholder: 'Port',
    },
    {
        type: 'textarea',
        name: 'ups_options',
        placeholder: 'Auxiliary Parameters(ups.conf)',
    },
    {
        type: 'textarea',
        name: 'ups_optionsupsd',
        placeholder: 'Auxiliary Parameters(upsd.conf)',
    },
    {
        type: 'input',
        name: 'ups_description',
        placeholder: 'Description',
    },
    {
        type: 'select',
        name: 'ups_shutdown',
        placeholder: 'Shutdown Mode',
        options: [
          { label: 'UPS reaches low battery', value: 'lowbatt'},
          { label: 'UPS goes on battery', value: 'batt'},
        ]
    },
    {
        type: 'input',
        name: 'ups_shutdowntimer',
        placeholder: 'Shutdown Timer',
    },
    {
        type: 'input',
        name: 'ups_shutdowncmd',
        placeholder: 'Shutdown Command',
    },
    {
        type: 'input',
        name: 'ups_monuser',
        placeholder: 'Monitor User',
    },
    {
        type: 'input',
        name: 'ups_monpwd',
        placeholder: 'Monitor Password',
    },
    {
        type: 'textarea',
        name: 'ups_extrausers',
        placeholder: 'Extra Users(upsd.conf)',
    },
    {
        type: 'checkbox',
        name: 'ups_rmonitor',
        placeholder: 'Remote Monitor',
    },
    {
        type: 'checkbox',
        name: 'ups_emailnotify',
        placeholder: 'Send Email Status Updates',
    },
    {
        type: 'input',
        name: 'ups_toemail',
        placeholder: 'To Email',
    },
    {
        type: 'input',
        name: 'ups_subject',
        placeholder: 'Email Subject',
    },
    {
        type: 'checkbox',
        name: 'ups_powerdown',
        placeholder: 'Power Off UPS',
    },
  ];
  
 constructor(
    protected router: Router,
    protected route: ActivatedRoute, 
    protected rest: RestService,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected _state: GlobalState
  ){}

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
  }

}