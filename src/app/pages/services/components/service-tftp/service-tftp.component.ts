import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import {
  matchOtherValidator
} from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'tftp-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceTFTPComponent {

  protected resource_name: string = 'services/tftp';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'explorer',
      initial: '/mnt',
      name : 'tftp_directory',
      placeholder : 'Directory',
    },
    {
      type : 'checkbox',
      name : 'tftp_newfiles',
      placeholder : 'Allow New Files',
    },
    {
      type : 'input',
      name : 'tftp_port',
      placeholder : 'Port',
    },
    {
      type : 'select',
      name : 'tftp_username',
      placeholder : 'Username',
      options : [
        {label : '', value : ''},
        {label : 'null', value : ''},
      ]
    },
    {
      type : 'input',
      name : 'tftp_umask',
      placeholder : 'Umask',
    },
    {
      type : 'textarea',
      name : 'tftp_options',
      placeholder : 'Extra options',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState) {}

  afterInit(entityEdit: any) { }
}
