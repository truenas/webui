import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ipv4or6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import helptext from '../../../helptext/network/staticroutes/staticroutes';
import { NetworkService, WebSocketService } from '../../../services';

@Component({
  selector: 'app-staticroute-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class StaticRouteFormComponent {
  protected queryCall = 'staticroute.query';
  protected queryKey = 'id';
  protected addCall = 'staticroute.create';
  protected editCall = 'staticroute.update';

  protected isEntity = true;
  protected isOneColumnForm = true;
  public afterModalFormClosed;

  protected fieldSets: FieldSet[] = [
    {
      name: helptext.sr_fieldset_general,
      label: true,
      config: [
        {
          type: 'input',
          name: 'destination',
          placeholder: helptext.sr_destination_placeholder,
          tooltip: helptext.sr_destination_tooltip,
          required: true,
          validation: helptext.sr_destination_validation
        },
        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.sr_gateway_placeholder,
          tooltip: helptext.sr_gateway_tooltip,
          required: true,
          validation: [ipv4or6Validator('gateway')]
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.sr_description_placeholder,
          tooltip: helptext.sr_description_tooltip
        }
      ]
    }
  ];
  public title: string;
  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected networkService: NetworkService) { }

  afterInit(entityForm) {
    if (entityForm.pk !== undefined) {
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
    }
  }
}
