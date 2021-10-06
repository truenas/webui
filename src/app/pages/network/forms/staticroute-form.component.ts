import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import helptext from 'app/helptext/network/static-routes/static-routes';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ipv4or6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { NetworkService, WebSocketService } from 'app/services';

@Component({
  selector: 'app-staticroute-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class StaticRouteFormComponent implements FormConfiguration {
  queryCall: 'staticroute.query' = 'staticroute.query';
  queryKey = 'id';
  addCall: 'staticroute.create' = 'staticroute.create';
  editCall: 'staticroute.update' = 'staticroute.update';

  isEntity = true;
  protected isOneColumnForm = true;
  afterModalFormClosed: () => void;

  fieldSets: FieldSet[] = [
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
          validation: helptext.sr_destination_validation,
        },
        {
          type: 'input',
          name: 'gateway',
          placeholder: helptext.sr_gateway_placeholder,
          tooltip: helptext.sr_gateway_tooltip,
          required: true,
          validation: [ipv4or6Validator()],
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.sr_description_placeholder,
          tooltip: helptext.sr_description_tooltip,
        },
      ],
    },
  ];
  title: string;
  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected networkService: NetworkService) { }

  afterInit(entityForm: EntityFormComponent): void {
    if (entityForm.pk !== undefined) {
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
    }
  }
}
