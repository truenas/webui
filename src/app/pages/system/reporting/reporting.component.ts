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
    placeholder: T('Report CPU usage in percentage'),
    tooltip: T('Set to display CPU usage as percentages in Reporting.')
  },
  {
    type: 'input',
    name: 'graphite',
    placeholder: T('Remote Graphite Server Hostname'),
    tooltip: T('Enter the IP address or hostname of a remote server\
                running Graphite.')
  },
  {
    type: 'input',
    name: 'graph_age',
    placeholder: T('Graph Age'),
    tooltip: T(''),
//    validation: rangeValidator(0)
  },
  {
    type: 'input',
    name: 'graph_points',
    placeholder: T('Graph Points'),
    tooltip: T(''),
//    validation: rangeValidator(0)
  },
  {
    type: 'checkbox',
    name: 'confirm_rrd_destroy',
    placeholder: T('Confirm RRD Destroy'),
    tooltip: T('')
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
