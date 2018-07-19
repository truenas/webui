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

import { RestService, WebSocketService } from '../../../../services';
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
      tooltip: T('The name of the sysctl or driver to load.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'textarea',
      name: 'tun_value',
      placeholder: T('Value'),
      tooltip: T('Set a value for the variable. Refer to the man page\
                  for the specific driver or the <a\
                  href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/"\
                  target="_blank">FreeBSD Handbook</a> for suggested\
                  values.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'select',
      name: 'tun_type',
      placeholder: T('Type'),
      tooltip: T('Creating or editing a <i>Sysctl</i> immediately\
                  updates the <b>Variable</b>. A reboot is required when\
                  a <i>Loader</i> or <i>rc.conf</i> value changes.\
                  A tunable remains at boot and across upgrades unless\
                  it is deleted or <b>Enabled</b> is unset.'),
      options: [
        { label: 'Loader', value: 'loader' },
        { label: 'rc.conf', value: 'rc' },
        { label: 'Sysctl', value: 'sysctl' },
      ]
    },
    {
      type: 'input',
      name: 'tun_comment',
      placeholder: T('Comment'),
      tooltip: T('Optional. Enter a substantive description or\
                  explanation of this tunable.'),
    },
    {
      type: 'checkbox',
      name: 'tun_enabled',
      placeholder: T('Enabled'),
      tooltip: T('Unset to disable this tunable without deleting it.'),
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
