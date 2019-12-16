import { Component } from '@angular/core';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { helptext } from 'app/helptext/system/reporting';

@Component({
  selector: 'app-system-reporting',
  templateUrl: 'reporting.component.html',
  styleUrls: ['reporting.component.css'],
})

export class ReportingComponent {
  public job: any = {};
  protected queryCall = 'reporting.config';
  public entityForm: any;
  public rrd_checkbox: any;
  public graphPoints: any;
  public graphAge: any;

  custActions: any[] = [
    {
      id:'reset',
      name:helptext.reset_button,
      function : () => {
        this.entityForm.formGroup.controls['cpu_in_percentage'].setValue(false);
        this.entityForm.formGroup.controls['graphite'].setValue(this.entityForm.wsResponse['graphite']);
        this.entityForm.formGroup.controls['graph_age'].setValue(12);
        this.entityForm.formGroup.controls['graph_points'].setValue(1200);
        this.entityForm.formGroup.markAsDirty();
      }
    }
  ]

  public fieldConfig: FieldConfig[] = [{
    type: 'checkbox',
    name: 'cpu_in_percentage',
    placeholder: helptext.cpu_in_percentage_placeholder,
    tooltip: helptext.cpu_in_percentage_tooltip,
  },
  {
    type: 'input',
    name: 'graphite',
    placeholder: helptext.graphite_placeholder,
    tooltip: helptext.graphite_tooltip
  },
  {
    type: 'input',
    name: 'graph_age',
    inputType: 'number',
    placeholder: helptext.graph_age_placeholder,
    tooltip: helptext.graph_age_tooltip,
    validation: helptext.graph_age_validation,
    required: true
  },
  {
    type: 'input',
    name: 'graph_points',
    inputType: 'number',
    placeholder: helptext.graph_points_placeholder,
    tooltip: helptext.graph_points_tooltip,
    validation: helptext.graph_points_validation,
    required: true
  },
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private ws: WebSocketService,
    protected dialog: DialogService
  ) {}

  resourceTransformIncomingRestData(data) {
    this.graphPoints = data.graph_points;
    this.graphAge = data.graph_age;
    return data;
  }

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }
  
  public customSubmit(body) {
    if (body.graph_age !== this.graphAge || body.graph_points !== this.graphPoints) {
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
    this.load.open();
    return this.ws.call('reporting.update', [body]).subscribe((res) => {
      this.load.close();
      this.entityForm.success = true;
      this.entityForm.formGroup.markAsPristine();
    }, (err) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, err);
    });
  }
}
