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
      tooltip: T('Enter the name of the loader, sysctl, or rc.conf\
                  variable to configure. <i>loader</i> tunables are used\
                  to specify parameters to pass to the kernel or load\
                  additional modules at boot time. <i>rc.conf</i>\
                  tunables are for enabling system services and daemons\
                  and only take effect after a reboot. <i>sysctl</i> \
                  tunables are used to configure kernel parameters while\
                  the system is running and generally take effect\
                  immediately.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'tun_value',
      placeholder: T('Value'),
      tooltip: T('Enter a value to use for the <a\
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
                  updates the Variable to the configured Value. A restart\
                  is required to apply <i>loader</i> or <i>rc.conf</i>\
                  tunables. Configured tunables remain in effect until\
                  deleted or Enabled is unset.'),
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
      tooltip: T('Enter a description of the tunable.'),
    },
    {
      type: 'checkbox',
      name: 'tun_enabled',
      placeholder: T('Enabled'),
      tooltip: T('Enable this tunable. Unset to disable this tunable\
                  without deleting it.'),
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
