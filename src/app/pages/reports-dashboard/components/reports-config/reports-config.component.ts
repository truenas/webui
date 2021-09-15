import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { helptext } from 'app/helptext/system/reporting';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { ReportingConfig, ReportingConfigUpdate } from 'app/interfaces/reporting.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-reports-config',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: ['reports-config.component.scss'],
})
export class ReportsConfigComponent implements FormConfiguration {
  queryCall: 'reporting.config' = 'reporting.config';
  title: string;
  isOneColumnForm: boolean;
  entityForm: EntityFormComponent;
  isCpuCheckboxChecked: boolean;
  graphPoints: number;
  graphAge: number;
  graphite_separateinstances: boolean;

  custActions = [
    {
      id: 'reset',
      name: helptext.reset_button,
      function: () => {
        this.entityForm.formGroup.controls['cpu_in_percentage'].setValue(false);
        this.entityForm.formGroup.controls['graphite_separateinstances'].setValue(false);
        this.entityForm.formGroup.controls['graphite'].setValue(this.entityForm.wsResponse['graphite']);
        this.entityForm.formGroup.controls['graph_age'].setValue(12);
        this.entityForm.formGroup.controls['graph_points'].setValue(1200);
        this.entityForm.formGroup.markAsDirty();
      },
    },
  ];

  fieldSets = new FieldSets([
    {
      name: helptext.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'cpu_in_percentage',
          placeholder: helptext.cpu_in_percentage_placeholder,
          tooltip: helptext.cpu_in_percentage_tooltip,
        },
        {
          type: 'checkbox',
          name: 'graphite_separateinstances',
          placeholder: helptext.graphite_separateinstances_placeholder,
          tooltip: helptext.graphite_separateinstances_tooltip,
        },
        {
          type: 'input',
          name: 'graphite',
          placeholder: helptext.graphite_placeholder,
          tooltip: helptext.graphite_tooltip,
        },
        {
          type: 'input',
          name: 'graph_age',
          placeholder: helptext.graph_age_placeholder,
          tooltip: helptext.graph_age_tooltip,
          validation: helptext.graph_age_validation,
          required: true,
        },
        {
          type: 'input',
          name: 'graph_points',
          placeholder: helptext.graph_points_placeholder,
          tooltip: helptext.graph_points_tooltip,
          validation: helptext.graph_points_validation,
          required: true,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]);

  afterModalFormSaved?: () => void;

  constructor(
    private ws: WebSocketService,
    protected dialog: DialogService,
  ) {}

  resourceTransformIncomingRestData(data: ReportingConfig): ReportingConfig {
    this.graphPoints = data.graph_points;
    this.graphAge = data.graph_age;
    this.isCpuCheckboxChecked = data.cpu_in_percentage;
    this.graphite_separateinstances = data.graphite_separateinstances;
    return data;
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.entityForm = entityEdit;
  }

  customSubmit(body: any): void {
    if (body.graph_age !== this.graphAge || body.graph_points !== this.graphPoints) {
      this.dialog.confirm({
        title: helptext.dialog.title,
        message: helptext.dialog.message,
        buttonMsg: helptext.dialog.action,
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        body.confirm_rrd_destroy = true;
        this.doSubmit(body);
      });
    } else {
      this.doSubmit(body);
    }
  }

  doSubmit(body: ReportingConfigUpdate): Subscription {
    this.graphAge = body.graph_age;
    this.graphPoints = body.graph_points;
    this.isCpuCheckboxChecked = body.cpu_in_percentage;
    return this.ws.call('reporting.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.afterModalFormSaved();
    }, (err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });
  }
}
