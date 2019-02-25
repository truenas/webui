import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ntpservers as helptext } from 'app/helptext/system/ntpservers';
import { RestService } from '../../../../services/rest.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-ntpserver-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class NTPServerEditComponent {

  protected resource_name: string = 'system/ntpserver/';
  protected route_success: string[] = ['system', 'ntpservers'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'ntp_address',
      placeholder: helptext.edit.address.placeholder,
      tooltip: helptext.edit.address.tooltip,
    },
    {
      type: 'checkbox',
      name: 'ntp_burst',
      placeholder: helptext.edit.burst.placeholder,
      tooltip: helptext.edit.burst.tooltip,
    },
    {
      type: 'checkbox',
      name: 'ntp_iburst',
      placeholder: helptext.edit.iburst.placeholder,
      tooltip: helptext.edit.iburst.tooltip,
    },
    {
      type: 'checkbox',
      name: 'ntp_prefer',
      placeholder: helptext.edit.prefer.placeholder,
      tooltip: helptext.edit.prefer.tooltip,
    },
    {
      type: 'input',
      name: 'ntp_minpoll',
      placeholder: helptext.edit.minpoll.placeholder,
      inputType: 'number',
      validation: helptext.edit.minpoll.validation,
      tooltip: helptext.edit.minpoll.tooltip,
    },
    {
      type: 'input',
      name: 'ntp_maxpoll',
      placeholder: helptext.edit.maxpoll.placeholder,
      inputType: 'number',
      validation: helptext.edit.maxpoll.validation,
      tooltip: helptext.edit.maxpoll.tooltip,
    },
    {
      type: 'checkbox',
      name: 'force',
      placeholder: helptext.edit.force.placeholder,
      tooltip: helptext.edit.force.tooltip,
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService) {}

  afterInit(entityEdit) {}
}
