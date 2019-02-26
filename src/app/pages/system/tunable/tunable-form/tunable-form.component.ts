import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_tunable as helptext } from 'app/helptext/system/tunable';
import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

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
      placeholder: helptext.var.placeholder,
      tooltip: helptext.var.tooltip,
      required: true,
      validation : helptext.var.validation
    },
    {
      type: 'textarea',
      name: 'tun_value',
      placeholder: helptext.value.placeholder,
      tooltip: helptext.value.tooltip,
      required: true,
      validation : helptext.value.validation
    },
    {
      type: 'select',
      name: 'tun_type',
      placeholder: helptext.type.placeholder,
      tooltip: helptext.type.tooltip,
      options: [
        { label: 'loader', value: 'loader' },
        { label: 'rc.conf', value: 'rc' },
        { label: 'sysctl', value: 'sysctl' },
      ]
    },
    {
      type: 'input',
      name: 'tun_comment',
      placeholder: helptext.comment.placeholder,
      tooltip: helptext.comment.tooltip,
    },
    {
      type: 'checkbox',
      name: 'tun_enabled',
      placeholder: helptext.enabled.placeholder,
      tooltip: helptext.enabled.tooltip,
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
