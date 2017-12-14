import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-ntpserver-add',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class NTPServerAddComponent {

  protected route_success: string[] = [ 'system', 'ntpservers' ];
  protected resource_name: string = 'system/ntpserver';
  protected isEntity: boolean = true;
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'ntp_address',
      placeholder : 'Address',
      tooltip: 'Enter the name of the <b>NTP</b> server.',
    },
    {
      type : 'checkbox',
      name : 'ntp_burst',
      placeholder : 'Burst',
      tooltip: 'Recommended when <i>Max. Poll</i> is greater\
 than 10; only use on your own servers i.e. do not use with\
 a public NTP server.',
    },
    {
      type : 'checkbox',
      name : 'ntp_iburst',
      placeholder : 'IBurst',
      tooltip: 'Speeds the initial synchronization\
 (seconds instead of minutes).',
    },
    {
      type : 'checkbox',
      name : 'ntp_prefer',
      placeholder : 'Prefer',
      tooltip: 'Should only be used for <b>NTP</b> servers known to\
 be highly accurate, such as those with time monitoring hardware.',
    },
    {
      type : 'input',
      name : 'ntp_minpoll',
      placeholder : 'Min. Poll',
      tooltip: 'Power of 2 in seconds; cannot be lower than 4 or\
 higher than <i>Max. Poll</i> which is 17.',
      value : 6
    },
    {
      type : 'input',
      name : 'ntp_maxpoll',
      placeholder : 'Max. Poll',
      tooltip:'Power of 2 in seconds; cannot be higher than 17 or\
 lower than <i>Min. Poll</i>.',
      value : 10,
    },
    {
      type : 'checkbox',
      name : 'force',
      placeholder : 'Force',
      tooltip: 'Forces the addition of the <b>NTP</b> server,\
 even if it is currently unreachable.',
    },
  ];

  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {}

  afterInit(entityAdd: any) {}
}
