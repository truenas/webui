import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {Validators} from '@angular/forms';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';

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
      placeholder : T('Destination'),
      tooltip : T('Use the format <i>A.B.C.D/E</i> where <i>E</i> is the\
                   CIDR mask.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'sr_gateway',
      placeholder : T('Gateway'),
      tooltip : T('Enter the IP address of the gateway.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'sr_description',
      placeholder : T('Description'),
      tooltip : T('Enter any notes about the new static route.'),
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}

  afterInit(entityForm: any) {}
}
