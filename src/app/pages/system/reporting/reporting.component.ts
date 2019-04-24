import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';
import { AppLoaderService } from "../../../services/app-loader/app-loader.service";
import { DialogService } from "../../../services/dialog.service";
import { MatSnackBar } from '@angular/material';
import { EntityUtils } from '../../common/entity/utils';
import { RestService, WebSocketService } from '../../../services/';
import { rangeValidator } from '../../common/entity/entity-form/validators/range-validation';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
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
  private settings_saved = T("Settings saved.")

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
//    validation: rangeValidator(0)
  },
  {
    type: 'input',
    name: 'graph_points',
    placeholder: helptext.graph_points_placeholder,
    tooltip: helptext.graph_points_tooltip,
//    validation: rangeValidator(0)
  },
  {
    type: 'checkbox',
    name: 'confirm_rrd_destroy',
    placeholder: helptext.confirm_rrd_destroy_placeholder,
    tooltip: helptext.confirm_rrd_destroy_tooltip
  }
];

  constructor(private rest: RestService,
    private load: AppLoaderService,
    private ws: WebSocketService,
    public snackBar: MatSnackBar,
  ) {}


  afterInit(entityEdit: any) {
    this.entityForm = entityEdit;
  }

  public customSubmit(body) {
    this.load.open();

    return this.ws.call('reporting.update', [body]).subscribe((res) => {
      this.load.close();
      this.snackBar.open(this.settings_saved, T('close'), { duration: 5000 });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }


}
