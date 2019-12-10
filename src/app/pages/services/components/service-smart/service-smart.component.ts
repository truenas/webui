import { ApplicationRef, Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/services/components/service-smart';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'smart-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceSMARTComponent {

  protected queryCall = 'smart.config';
  protected route_success: string[] = [ 'services' ];

  public fieldSets: FieldSet[] = [
    {
      name: helptext.smart_fieldset_general,
      label: true,
      config: [
        {
          type : 'input',
          name : 'interval',
          placeholder : helptext.smart_interval_placeholder,
          tooltip: helptext.smart_interval_tooltip,
          required: true,
          validation : [ Validators.required ]
        },
        {
          type : 'select',
          name : 'powermode',
          placeholder : helptext.smart_powermode_placeholder,
          tooltip: helptext.smart_powermode_tooltip,
          options : helptext.smart_powermode_options,
          required: true,
          validation : helptext.smart_powermode_validation
        },
        {
          type : 'input',
          name : 'difference',
          placeholder : helptext.smart_difference_placeholder,
          tooltip: helptext.smart_difference_tooltip,
          required: true,
          validation : helptext.smart_difference_validation
        },
        {
          type : 'input',
          name : 'informational',
          placeholder : helptext.smart_informational_placeholder,
          tooltip: helptext.smart_informational_tooltip,
          required: true,
          validation : helptext.smart_informational_validation
        },
        {
          type : 'input',
          name : 'critical',
          placeholder : helptext.smart_critical_placeholder,
          tooltip: helptext.smart_critical_tooltip,
          required: true,
          validation : helptext.smart_critical_validation
        }
      ]
    },
    { name: 'divider', divider: true }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('smart.update', [body]);
  }
}
