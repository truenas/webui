import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/network/staticroutes/staticroutes';
import { NetworkService, RestService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'app-staticroute-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class StaticRouteFormComponent {
  protected queryCall = 'staticroute.query';
  protected queryKey = 'id';
  protected addCall = 'staticroute.create';
  protected editCall = 'staticroute.update';

  protected route_success: string[] = [ 'network', 'staticroutes' ];
  protected isEntity = true;

  protected fieldSets: FieldSet[] = [
    {
      name: helptext.sr_fieldset_general,
      label: true,
      config: [
        {
          type : 'input',
          name : 'destination',
          placeholder : helptext.sr_destination_placeholder,
          tooltip : helptext.sr_destination_tooltip,
          required: true,
          validation : helptext.sr_destination_validation
        },
        {
          type : 'input',
          name : 'gateway',
          placeholder : helptext.sr_gateway_placeholder,
          tooltip : helptext.sr_gateway_tooltip,
          required: true,
          validation : helptext.sr_gateway_validation
        },
        {
          type : 'input',
          name : 'description',
          placeholder : helptext.sr_description_placeholder,
          tooltip : helptext.sr_description_tooltip
        }
      ]
    }
  ];

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}
}
