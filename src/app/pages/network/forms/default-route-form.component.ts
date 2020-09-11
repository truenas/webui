import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ipv4Validator, ipv6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';

import { NetworkService, WebSocketService } from '../../../services';
import helptext from '../../../helptext/network/configuration/configuration';

@Component({
  selector: 'app-default-route-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class DefaultRouteFormComponent {
  protected queryCall = 'network.configuration.config';
  protected updateCall = 'network.configuration.update';

  protected isNew = false;
  protected isOneColumnForm = true;

  protected fieldSets: FieldSet[] = [
    {
      name: helptext.gateway,
      label: false,
      config: [
        {
          type: 'input',
          name: 'ipv4gateway',
          placeholder: helptext.ipv4gateway_placeholder,
          tooltip: helptext.ipv4gateway_tooltip,
          validation: [ipv4Validator('ipv4gateway')]
        },
        {
          type: 'input',
          name: 'ipv6gateway',
          placeholder: helptext.ipv6gateway_placeholder,
          tooltip: helptext.ipv6gateway_tooltip,
          validation: [ipv6Validator('ipv6gateway')]
        }
      ]
    }
  ];

  public title = helptext.gateway;
  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected networkService: NetworkService) { }
}
