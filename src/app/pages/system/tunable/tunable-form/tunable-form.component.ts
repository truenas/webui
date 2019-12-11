import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_tunable as helptext } from 'app/helptext/system/tunable';
import { WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'system-tunable-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class TunableFormComponent {
  protected queryCall = 'tunable.query';
  protected queryKey = 'id';
  protected editCall = 'tunable.update';
  protected addCall = 'tunable.create';
  protected pk: any;
            
  protected route_success: string[] = ['system', 'tunable'];
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [];
  protected fieldSets: FieldSet[] = [
    {
      name: 'Tunable',
      class:'add-cron',
      label:true,
      width:'300px',
      config:[
        {
          type: 'input',
          name: 'var',
          placeholder: helptext.var.placeholder,
          tooltip: helptext.var.tooltip,
          required: true,
          validation : helptext.var.validation
        },
        {
          type: 'textarea',
          name: 'value',
          placeholder: helptext.value.placeholder,
          tooltip: helptext.value.tooltip,
          required: true,
          validation : helptext.value.validation
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.type.placeholder,
          tooltip: helptext.type.tooltip,
          options: [
            { label: 'loader', value: 'LOADER' },
            { label: 'rc.conf', value: 'RC' },
            { label: 'sysctl', value: 'SYSCTL' },
          ]
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext.description.placeholder,
          tooltip: helptext.description.tooltip,
        },
        {
          type: 'checkbox',
          name: 'enabled',
          placeholder: helptext.enabled.placeholder,
          tooltip: helptext.enabled.tooltip,
        },
      ]
    },
    {
      name:'divider',
      divider:true
    },
  ]


  constructor(protected router: Router, 
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector, 
    protected _appRef: ApplicationRef) {}

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['enabled'].setValue(true);
    entityForm.formGroup.controls['type'].setValue('loader');
  }
}
