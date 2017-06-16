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
    selector: 'tftp-edit',
    template: `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceTFTPComponent {

  protected resource_name: string = 'services/tftp';
  private entityEdit: EntityConfigComponent;
  protected route_success: string[] = ['services'];

  protected fieldConfig: FieldConfig[] = [
    {
        type: 'input',
        name: 'tftp_directory',
        placeholder: 'Directory',
    },
    {
        type: 'checkbox',
        name: 'tftp_newfiles',
        placeholder: 'Allow New Files',
    },
    {
        type: 'input',
        name: 'tftp_port',
        placeholder: 'Port',
    },
    {
        type: 'select',
        name: 'tftp_username',
        placeholder: 'Username',
        options: [
        { label: '', value: ''},
        { label: 'null', value: ''},
      ]
    },
    {
        type: 'input',
        name: 'tftp_umask',
        placeholder: 'Umask',
    },
    {
        type: 'textarea',
        name: 'tftp_options',
        placeholder: 'Extra options',
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



