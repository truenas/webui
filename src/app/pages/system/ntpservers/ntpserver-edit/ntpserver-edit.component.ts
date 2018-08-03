import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { RestService } from '../../../../services/rest.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { greaterThan } from '../../../common/entity/entity-form/validators/compare-validation';

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
      placeholder: T('Address'),
      tooltip: T('Enter the hostname or IP address of the <b>NTP</b>\
       server.'),
    },
    {
      type: 'checkbox',
      name: 'ntp_burst',
      placeholder: T('Burst'),
      tooltip: T('Recommended when <i>Max. Poll</i> is greater\
                  than 10. Only use on personal NTP servers or those\
		  under direct control. <b>Do not</b> enable when\
		  using public NTP servers.'),
    },
    {
      type: 'checkbox',
      name: 'ntp_iburst',
      placeholder: T('IBurst'),
      tooltip: T('Speeds up the initial synchronization\
       (seconds instead of minutes).'),
    },
    {
      type: 'checkbox',
      name: 'ntp_prefer',
      placeholder: T('Prefer'),
      tooltip: T('Should only be used for highly accurate <b>NTP</b>\
       servers such as those with time monitoring hardware.'),
    },
    {
      type: 'input',
      name: 'ntp_minpoll',
      placeholder: T('Min. Poll'),
      inputType: 'number',
      validation: [Validators.min(4),Validators.required],
      tooltip: T('Power of 2 in seconds; cannot be lower than 4 or\
       higher than <i>Max. Poll</i>.'),
    },
    {
      type: 'input',
      name: 'ntp_maxpoll',
      placeholder: T('Max. Poll'),
      inputType: 'number',
      validation: [Validators.max(17), greaterThan('ntp_minpoll'), Validators.required,],
      tooltip: T('Power of 2 in seconds; cannot be higher than 17 or\
       lower than <i>Min. Poll</i>.'),
    },
    {
      type: 'checkbox',
      name: 'force',
      placeholder: T('Force'),
      tooltip: T('Forces the addition of the <b>NTP</b> server,\
       even if it is currently unreachable.'),
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService) {}

  afterInit(entityEdit) {}
}
