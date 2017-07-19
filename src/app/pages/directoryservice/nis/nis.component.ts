import {ApplicationRef, Component, Injector, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';

import {GlobalState} from '../../../global.state';
import {
  RestService,
  SystemGeneralService,
  WebSocketService
} from '../../../services/';
import {
  FieldConfig
} from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'nis',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class NISComponent {
  protected resource_name: string = 'directoryservice/nis/';

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'nis_domain',
      placeholder : 'NIS domain:',
    },
    {type : 'input', name : 'nis_servers', placeholder : 'NIS servers:'},
    {
      type : 'checkbox',
      name : 'nis_secure_mode',
      placeholder : 'Secure mode',
    },
    {
      type : 'checkbox',
      name : 'nis_manycast',
      placeholder : 'Manycast',
    },
    {
      type : 'checkbox',
      name : 'nis_enable',
      placeholder : 'Enable',
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              protected _state: GlobalState,
              protected systemGeneralService: SystemGeneralService) {}
}
