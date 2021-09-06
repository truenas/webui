import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { ProductType } from 'app/enums/product-type.enum';
import { TunableType } from 'app/enums/tunable-type.enum';
import { helptext_system_tunable as helptext } from 'app/helptext/system/tunable';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-system-tunable-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class TunableFormComponent implements FormConfiguration {
  queryCall: 'tunable.query' = 'tunable.query';
  queryKey = 'id';
  editCall: 'tunable.update' = 'tunable.update';
  addCall: 'tunable.create' = 'tunable.create';
  pk: any;
  title: string;
  protected isOneColumnForm = true;

  isEntity = true;

  protected product_type: ProductType;
  protected type_fc: FormSelectConfig;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.metadata.fieldsets[0],
      class: 'add-cron',
      label: false,
      config: [
        {
          type: 'input',
          name: 'var',
          placeholder: helptext.var.placeholder,
          tooltip: helptext.var.tooltip,
          required: true,
          validation: helptext.var.validation,
        },
        {
          type: 'textarea',
          name: 'value',
          placeholder: helptext.value.placeholder,
          tooltip: helptext.value.tooltip,
          required: true,
          validation: helptext.value.validation,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.type.placeholder,
          tooltip: helptext.type.tooltip,
          required: false,
          options: [],
          value: TunableType.Sysctl,
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
      ],
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  constructor(protected ws: WebSocketService, protected sysGeneralService: SystemGeneralService) {}

  preInit(): void {
    this.type_fc = _.find(this.fieldSets[0].config, { name: 'type' });
    this.ws.call('tunable.tunable_type_choices').pipe(untilDestroyed(this)).subscribe((tunables) => {
      for (const key in tunables) {
        this.type_fc.options.push({ label: tunables[key], value: key });
      }
    });
    this.product_type = window.localStorage.getItem('product_type') as ProductType;
    if (this.product_type === ProductType.Scale || this.product_type === ProductType.ScaleEnterprise) {
      this.type_fc.value = TunableType.Sysctl;
      this.type_fc.isHidden = true;
      this.fieldSets[0].name = helptext.metadata.fieldsets_scale[0];
    }
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.title = `${entityForm.isNew ? T('Add') : T('Edit')} ${this.fieldSets[0].name}`;
    entityForm.formGroup.controls['enabled'].setValue(true);
  }

  afterSubmit(): void {
    this.sysGeneralService.refreshSysGeneral();
  }
}
