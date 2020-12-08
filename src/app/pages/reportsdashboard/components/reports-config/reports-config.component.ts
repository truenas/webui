import { Component } from '@angular/core';
import { helptext } from 'app/helptext/system/reporting';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { DialogService, WebSocketService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-reports-config',
  template: `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['reports-config.component.css'],
})
export class ReportsConfigComponent {
  public job: any = {};
  protected queryCall = 'reporting.config';
  public title: string;
  public isOneColumnForm: boolean;
  public entityForm: any;
  public isCpuCheckboxChecked: boolean;
  public graphPoints: any;
  public graphAge: any;
  public graphite_separateinstances: any;

  custActions: any[] = [
    {
      id:'reset',
      name:helptext.reset_button,
      function : () => {
        this.entityForm.formGroup.controls['cpu_in_percentage'].setValue(false);
        this.entityForm.formGroup.controls['graphite_separateinstances'].setValue(false);
        this.entityForm.formGroup.controls['graphite'].setValue(this.entityForm.wsResponse['graphite']);
        this.entityForm.formGroup.controls['graph_age'].setValue(12);
        this.entityForm.formGroup.controls['graph_points'].setValue(1200);
        this.entityForm.formGroup.markAsDirty();
      }
    }
  ]

  public fieldSets = new FieldSets([
    {
      name: helptext.fieldset_general,
      class: 'general',
      label: true,
      config: [
        {
          type: "checkbox",
          name: "cpu_in_percentage",
          placeholder: helptext.cpu_in_percentage_placeholder,
          tooltip: helptext.cpu_in_percentage_tooltip
        },
        {
          type: "checkbox",
          name: "graphite_separateinstances",
          placeholder:helptext.graphite_separateinstances_placeholder,
          tooltip: helptext.graphite_separateinstances_tooltip
        },
        {
          type: "input",
          name: "graphite",
          placeholder: helptext.graphite_placeholder,
          tooltip: helptext.graphite_tooltip
        },
        {
          type: "input",
          name: "graph_age",
          placeholder: helptext.graph_age_placeholder,
          tooltip: helptext.graph_age_tooltip,
          validation: helptext.graph_age_validation,
          required: true
        },
        {
          type: "input",
          name: "graph_points",
          placeholder: helptext.graph_points_placeholder,
          tooltip: helptext.graph_points_tooltip,
          validation: helptext.graph_points_validation,
          required: true
        }
      ]
    },
    { name: 'divider', divider: true }
  ]);

  public afterModalFormSaved?();

  constructor(
    private ws: WebSocketService,
    protected dialog: DialogService,
  ) {}

  resourceTransformIncomingRestData(data) {
    this.graphPoints = data.graph_points;
    this.graphAge = data.graph_age;
    this.isCpuCheckboxChecked = data.cpu_in_percentage;
    this.graphite_separateinstances = data.graphite_separateinstances;
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

  public customSubmit(body) {
    if (body.graph_age !== this.graphAge || body.graph_points !== this.graphPoints ||
      body.cpu_in_percentage !== this.isCpuCheckboxChecked) {
      this.dialog.confirm(helptext.dialog.title, helptext.dialog.message, false,
        helptext.dialog.action).subscribe((res) => {
        if (res) {
          body.confirm_rrd_destroy = true;
          this.doSubmit(body)
        }
      })
    } else {
      this.doSubmit(body)
    }

  }

  doSubmit(body) {
    this.graphAge = body.graph_age;
    this.graphPoints = body.graph_points;
    this.isCpuCheckboxChecked = body.cpu_in_percentage;
    return this.ws.call('reporting.update', [body]).subscribe((res) => {
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
      this.afterModalFormSaved();
    }, (err) => {
      new EntityUtils().handleWSError(this.entityForm, err);
    });
  }
}
