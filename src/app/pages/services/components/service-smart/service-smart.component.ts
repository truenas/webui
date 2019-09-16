import { ApplicationRef, Component, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-smart';

@Component({
  selector : 'smart-edit',
  template : `<entity-form [conf]="this"></entity-form>`,
})

export class ServiceSMARTComponent {

  protected resource_name: string = 'services/smart';
  protected route_success: string[] = [ 'services' ];

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'smart_interval',
      placeholder : helptext.smart_interval_placeholder,
      tooltip: helptext.smart_interval_tooltip,
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'smart_powermode',
      placeholder : helptext.smart_powermode_placeholder,
      tooltip: helptext.smart_powermode_tooltip,
      options : helptext.smart_powermode_options,
      required: true,
      validation : helptext.smart_powermode_validation
    },
    {
      type : 'input',
      name : 'smart_difference',
      placeholder : helptext.smart_difference_placeholder,
      tooltip: helptext.smart_difference_tooltip,
      required: true,
      validation : helptext.smart_difference_validation
    },
    {
      type : 'input',
      name : 'smart_informational',
      placeholder : helptext.smart_informational_placeholder,
      tooltip: helptext.smart_informational_tooltip,
      required: true,
      validation : helptext.smart_informational_validation
    },
    {
      type : 'input',
      name : 'smart_critical',
      placeholder : helptext.smart_critical_placeholder,
      tooltip: helptext.smart_critical_tooltip,
      required: true,
      validation : helptext.smart_critical_validation
    },
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}
}
