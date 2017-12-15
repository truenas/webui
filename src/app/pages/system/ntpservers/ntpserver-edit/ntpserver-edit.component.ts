import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
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
      placeholder: 'Address',
      tooltip: 'Enter the name of the <b>NTP</b> server.',
    },
    {
      type: 'checkbox',
      name: 'ntp_burst',
      placeholder: 'Burst',
      tooltip: 'Recommended when <i>Max. Poll</i> is greater\
 than 10; only use on your own servers i.e. do not use with\
 a public NTP server.',
    },
    {
      type: 'checkbox',
      name: 'ntp_iburst',
      placeholder: 'IBurst',
      tooltip: 'Speeds the initial synchronization\
 (seconds instead of minutes).',
    },
    {
      type: 'checkbox',
      name: 'ntp_prefer',
      placeholder: 'Prefer',
      tooltip: 'Should only be used for <b>NTP</b> servers known to\
 be highly accurate, such as those with time monitoring hardware.',
    },
    {
      type: 'input',
      name: 'ntp_minpoll',
      placeholder: 'Min. Poll',
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)],
      tooltip: 'Power of 2 in seconds; cannot be lower than 4 or\
 higher than <i>Max. Poll</i> which is 17.',
    },
    {
      type: 'input',
      name: 'ntp_maxpoll',
      placeholder: 'Max. Poll',
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)],
      tooltip: 'Power of 2 in seconds; cannot be higher than 17 or\
 lower than <i>Min. Poll</i>.',
    },
    {
      type: 'checkbox',
      name: 'force',
      placeholder: 'Force',
      tooltip: 'Forces the addition of the <b>NTP</b> server,\
 even if it is currently unreachable.',
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService) {}

  afterInit(entityEdit) {}
}
