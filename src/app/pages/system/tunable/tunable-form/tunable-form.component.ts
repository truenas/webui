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
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService } from '../../../../services/';
import { T } from '../../../../translate-marker';

import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'system-tunable-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class TunableFormComponent {

  protected resource_name: string = 'system/tunable';
  protected route_success: string[] = ['system', 'tunable'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'tun_var',
      placeholder: T('Variable'),
      tooltip: T('The name of the loader, sysctl, or rc.conf variable\
                  to configure.<br>\
                  <b>loader</b>: Tunables that can be set <b>only</b> at\
                  boot and not later.<br>\
                  <b>rc.conf</b>: Enable or disable system services and\
                  daemons.<br>\
                  <b>sysctl</b>: Tunables that can be set anytime.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'tun_value',
      placeholder: T('Value'),
      tooltip: T('Set a value to use for the <a\
                  href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/boot-introduction.html#boot-loader-commands"\
                  target="_blank">loader</a>, <a\
                  href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/configtuning-sysctl.html"\
                  target="_blank">sysctl</a>, or <a\
                  href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/config-tuning.html"\
                  target="_blank">rc.conf</a> variable.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'tun_type',
      placeholder: T('Type'),
      tooltip: T('Creating or editing a <i>sysctl</i> immediately\
                  updates the <b>Variable</b> to the configured\
                  <b>Value</b>. When using a <i>loader</i> or\
                   <i>rc.conf</i> tunable, a reboot is required to apply\
                  the <b>Value</b> configured. Tunables configured\
                  persist across reboots and upgrades until deleted or\
                  <b>Enabled</b> is unset.'),
      options: [
        { label: 'loader', value: 'loader' },
        { label: 'rc.conf', value: 'rc' },
        { label: 'sysctl', value: 'sysctl' },
      ]
    },
    {
      type: 'input',
      name: 'tun_comment',
      placeholder: T('Comment'),
      tooltip: T('Enter a description of the tunable. What the tunable\
                  does and why it\'s needed is helpful for future\
                  reference.'),
  },
  {
      type: 'checkbox',
      name: 'tun_enabled',
      placeholder: T('Enabled'),
      tooltip: T('Unset to disable but not delete the tunable.'),
  },
  ];


  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['tun_enabled'].setValue(true);
    entityForm.formGroup.controls['tun_type'].setValue('loader');
  }
}
