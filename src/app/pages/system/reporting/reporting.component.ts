import { Component } from '@angular/core';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService } from '../../../services/';
import { T } from '../../../translate-marker';
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
  private settings_saved = T("Settings saved.");
  public graphAge = [];
  public graphPoints = [];
  public rrd_checkbox: any;

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
    placeholder: helptext.graph_age_placeholder,
    tooltip: helptext.graph_age_tooltip,
    validation: helptext.graph_age_validation
  },
  {
    type: 'input',
    name: 'graph_points',
    placeholder: helptext.graph_points_placeholder,
    tooltip: helptext.graph_points_tooltip,
    validation: helptext.graph_points_validation
  },
  {
    type: 'checkbox',
    name: 'confirm_rrd_destroy',
    placeholder: helptext.confirm_rrd_destroy_placeholder,
    tooltip: helptext.confirm_rrd_destroy_tooltip,
    isHidden: true,
    value: false
  }
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private ws: WebSocketService,
    public snackBar: MatSnackBar,
  ) {}

  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
    this.rrd_checkbox = _.find(this.fieldConfig, {'name' : 'confirm_rrd_destroy'});
    entityEdit.formGroup.controls['graph_age'].valueChanges.subscribe((res) => {
      this.graphAge.push(res);
      if (parseInt(res) !== this.graphAge[0]) {
        this.rrd_checkbox['isHidden'] = false;
      } else {
        this.rrd_checkbox['isHidden'] = true;
      }
    });
      entityEdit.formGroup.controls['graph_points'].valueChanges.subscribe((res) => {
        this.graphPoints.push(res);
        if (parseInt(res) !== this.graphPoints[0]) {
          this.rrd_checkbox['isHidden'] = false;
        } else {
          this.rrd_checkbox['isHidden'] = true;
        }
      });
  }

  public customSubmit(body) {
    this.load.open();

    return this.ws.call('reporting.update', [body]).subscribe((res) => {
      this.load.close();
      this.rrd_checkbox['isHidden'] = true;
      this.entityForm.formGroup.controls['confirm_rrd_destroy'].setValue(false)
      this.graphAge = [parseInt(body.graph_age)];
      this.graphPoints = [parseInt(body.graph_points)];
      this.snackBar.open(this.settings_saved, T('close'), { duration: 5000 });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }
}
