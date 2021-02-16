import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_tunable as helptext } from 'app/helptext/system/tunable';
import { SystemGeneralService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import * as _ from 'lodash';
import { T } from 'app/translate-marker';

@Component({
  selector: 'app-system-tunable-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class TunableFormComponent {
  protected queryCall = 'tunable.query';
  protected queryKey = 'id';
  protected editCall = 'tunable.update';
  protected addCall = 'tunable.create';
  protected pk: any;
  protected title = helptext.metadata.fieldsets_scale[0];
  protected isOneColumnForm = true;
            
  protected route_success: string[] = ['system', 'advanced'];
  protected isEntity: boolean = true;

  protected product_type: any;
  protected type_fc: any;

  protected fieldConfig: FieldConfig[] = [];
  protected fieldSets: FieldSet[] = [
    {
      name: helptext.metadata.fieldsets[0],
      class:'add-cron',
      label:false,
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
          required: false,
          options: [],
          value: 'LOADER'
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
    protected _appRef: ApplicationRef,
    private sysGeneralService: SystemGeneralService) {}

  preInit(entityForm: any) {
    this.type_fc = _.find(this.fieldSets[0].config, {name: 'type'});
    this.ws.call('tunable.tunable_type_choices').subscribe(tunables => {
      for (const key in tunables) {
        this.type_fc.options.push({label: tunables[key], value: key});
      }
    })
    this.product_type = window.localStorage.getItem('product_type');
    if (this.product_type === 'SCALE' || this.product_type === 'SCALE_ENTERPRISE') {
      this.type_fc.value = 'SYSCTL';
      this.type_fc.isHidden = true;
      this.route_success[1] = 'advanced';
      this.fieldSets[0].name = helptext.metadata.fieldsets_scale[0];
    }
  }

  afterInit(entityForm: any) {
    entityForm.formGroup.controls['enabled'].setValue(true);
  }
  
  afterSubmit(value) {
    this.sysGeneralService.refreshSysGeneral();
  }
}
