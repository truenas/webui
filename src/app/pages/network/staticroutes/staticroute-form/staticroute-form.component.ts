import {Component} from '@angular/core';
import {Router} from '@angular/router';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-staticroute-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class StaticRouteFormComponent {

  protected resource_name: string = 'network/staticroute/';
  protected route_success: string[] = [ 'network', 'staticroutes' ];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'sr_destination',
      placeholder : 'Destination',
    },
    {
      type : 'input',
      name : 'sr_gateway',
      placeholder : 'Gateway',
    },
    {
      type : 'input',
      name : 'sr_description',
      placeholder : 'Description',
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}

  afterInit(entityForm: any) {}
}
