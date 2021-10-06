import { ApplicationRef, Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { SmartPowerMode } from 'app/enums/smart-power.mode';
import helptext from 'app/helptext/services/components/service-smart';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService } from 'app/services';

@Component({
  selector: 'smart-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class ServiceSMARTComponent implements FormConfiguration {
  queryCall: 'smart.config' = 'smart.config';
  route_success: string[] = ['services'];
  title = helptext.formTitle;

  fieldSets: FieldSet[] = [
    {
      name: helptext.smart_fieldset_general,
      label: true,
      config: [
        {
          type: 'input',
          name: 'interval',
          placeholder: helptext.smart_interval_placeholder,
          tooltip: helptext.smart_interval_tooltip,
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'select',
          name: 'powermode',
          placeholder: helptext.smart_powermode_placeholder,
          tooltip: helptext.smart_powermode_tooltip,
          options: [
            { label: T('Never'), value: SmartPowerMode.Never },
            { label: T('Sleep'), value: SmartPowerMode.Sleep },
            { label: T('Standby'), value: SmartPowerMode.Standby },
            { label: T('Idle'), value: SmartPowerMode.Idle },
          ],
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'input',
          name: 'difference',
          placeholder: helptext.smart_difference_placeholder,
          tooltip: helptext.smart_difference_tooltip,
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'input',
          name: 'informational',
          placeholder: helptext.smart_informational_placeholder,
          tooltip: helptext.smart_informational_tooltip,
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'input',
          name: 'critical',
          placeholder: helptext.smart_critical_placeholder,
          tooltip: helptext.smart_critical_tooltip,
          required: true,
          validation: [Validators.required],
        },
      ],
    },
    { name: 'divider', divider: true },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
  ) {}

  afterInit(entityEdit: EntityFormComponent): void {
    entityEdit.submitFunction = (body) => this.ws.call('smart.update', [body]);
  }
}
