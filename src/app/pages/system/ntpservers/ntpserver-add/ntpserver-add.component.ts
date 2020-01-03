import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Validators } from "@angular/forms";

import { helptext_system_ntpservers as helptext } from 'app/helptext/system/ntpservers';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { greaterThan } from "app/pages/common/entity/entity-form/validators/compare-validation";

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
      placeholder : helptext.add.address.placeholder,
      tooltip: helptext.add.address.tooltip,
    },
    {
      type : 'checkbox',
      name : 'ntp_burst',
      placeholder : helptext.add.burst.placeholder,
      tooltip: helptext.add.burst.tooltip,
    },
    {
      type : 'checkbox',
      name : 'ntp_iburst',
      placeholder : helptext.add.iburst.placeholder,
      tooltip: helptext.add.iburst.tooltip,
      value: true
    },
    {
      type : 'checkbox',
      name : 'ntp_prefer',
      placeholder : helptext.add.prefer.placeholder,
      tooltip: helptext.add.prefer.tooltip,
    },
    {
      type : 'input',
      name : 'ntp_minpoll',
      placeholder : helptext.add.minpoll.placeholder,
      tooltip: helptext.add.minpoll.tooltip,
      value : 6,
      validation: helptext.add.minpoll.validation
    },
    {
      type : 'input',
      name : 'ntp_maxpoll',
      placeholder : helptext.add.maxpoll.placeholder,
      tooltip: helptext.add.maxpoll.tooltip,
      value : 10,
      validation: [
        Validators.max(17),
        greaterThan("ntp_minpoll", [helptext.add.minpoll.placeholder]),
        Validators.required
      ]
    },
    {
      type : 'checkbox',
      name : 'force',
      placeholder : helptext.add.force.placeholder,
      tooltip: helptext.add.force.tooltip,
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
