import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { NetworkService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/network/staticroutes/staticroutes';

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
      placeholder : helptext.sr_destination_placeholder,
      tooltip : helptext.sr_destination_tooltip,
      required: true,
      validation : helptext.sr_destination_validation
    },
    {
      type : 'input',
      name : 'sr_gateway',
      placeholder : helptext.sr_gateway_placeholder,
      tooltip : helptext.sr_gateway_tooltip,
      required: true,
      validation : helptext.sr_gateway_validation
    },
    {
      type : 'input',
      name : 'sr_description',
      placeholder : helptext.sr_description_placeholder,
      tooltip : helptext.sr_description_tooltip
    },
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}

  afterInit(entityForm: any) {}
}
