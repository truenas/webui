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
      tooltip: T('Typically the name of the sysctl or driver to load,\
       as indicated by its man page.'),
    },
    {
      type: 'textarea',
      name: 'tun_value',
      placeholder: T('Value'),
      tooltip: T('Set a <b>value</b> for the variable. Choose value\
       carefully. Refer to the man page for the specific driver or the\
       <a href="https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/" target="_blank">FreeBSD Handbook</a>\
       for suggested values.'),
    },
    {
      type: 'select',
      name: 'tun_type',
      placeholder: T('Type'),
      tooltip: T('When a <b>Sysctl</b> is added or edited, the\
       running kernel changes the variable to the value specified.\
       Note a reboot is required when a <b>Loader</b> or <b>rc.conf</b>\
       value is changed. Regardless of the type of tunable, changes\
       persist at each boot and across upgrades unless the tunable\
       is deleted or its <b>Enabled</b> checkbox is unchecked.'),
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
      tooltip: T('Optional, but a useful reminder for the reason\
       behind adding this tunable.'),
    },
    {
      type: 'checkbox',
      name: 'tun_enabled',
      placeholder: T('Enable'),
      tooltip: T('Uncheck to disable the tunable without deleting it.'),
    },
  ];


  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected _injector: Injector, protected _appRef: ApplicationRef) {}

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['tun_enabled'].setValue(true);
  }
}
