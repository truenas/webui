import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ipv4or6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';

import { NetworkService, WebSocketService } from '../../../services';
import helptext from '../../../helptext/network/configuration/configuration';

@Component({
  selector : 'app-nameserver-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NameserverFormComponent {
  protected queryCall = 'network.configuration.config';
  protected updateCall = 'network.configuration.update';

  protected isNew = false;

  protected fieldSets: FieldSet[] = [
    {
      name: helptext.nameservers,
      label: false,
      config: [
        {
          type : 'input',
            name : 'nameserver1',
            placeholder : helptext.nameserver1_placeholder,
            tooltip : helptext.nameserver1_tooltip,
          },
          {
            type : 'input',
            name : 'nameserver2',
            placeholder : helptext.nameserver2_placeholder,
            tooltip : helptext.nameserver2_tooltip,
          },
          {
            type : 'input',
            name : 'nameserver3',
            placeholder : helptext.nameserver3_placeholder,
            tooltip : helptext.nameserver3_tooltip,
          },
      ]
    }
  ];

  public title = helptext.nameservers;
  constructor(protected aroute: ActivatedRoute,
              protected ws: WebSocketService,
              protected networkService: NetworkService) {}
}
