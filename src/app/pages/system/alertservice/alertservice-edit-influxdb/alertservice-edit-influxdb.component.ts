import {
  ApplicationRef,
  Component,
  Injector,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormGroup,
  Validators
} from '@angular/forms';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import * as _ from 'lodash';
import {Subscription} from 'rxjs';
import {RestService, WebSocketService} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-alertservice-edit-influxdb',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class AlertServiceEditInfluxdbComponent {

  protected resource_name = 'system/consulalerts';
  protected route_success: string[] = [ 'system', 'alertservice'];
  protected isNew = false;
  protected isEntity = true;
  
  
  protected fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'consulalert_type',
      placeholder: 'consulalert_type',
      value: 'InfluxDB',
      disabled: true
    },{
      type : 'input',
      name : 'username',
      placeholder: 'username',
      tooltip: 'Enter the username for this service.',
    },{
      type : 'input',
      name : 'password',
      placeholder: 'password',
      tooltip: 'Enter password.',
    },{
      type : 'input',
      name : 'host',
      placeholder: 'host',
      tooltip: 'Enter the InfluxDB host.',
    },{
      type : 'input',
      name : 'database',
      placeholder: 'database',
      tooltip: 'Enter the InfluxDB database name.',
    },{
      type : 'input',
      name : 'series_name',
      placeholder: 'series_name',
      tooltip: 'Enter the InfluxDB series name for the points.',
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled',
      tooltip: 'Check this box to enable the InfluxDB service.',
    },
  ];

  resourceTransformIncomingRestData(data:any): any {

    data.username = data.attributes.username;
    data.password = data.attributes.password;
    data.host = data.attributes.host;
    data.database = data.attributes.database;
    data.series_name = data.attributes.series_name;

    return data;
  };


  constructor(
      protected router: Router,
      protected route: ActivatedRoute,
      protected rest: RestService,
      protected ws: WebSocketService,
      protected _injector: Injector,
      protected _appRef: ApplicationRef
  ) {

  }

  afterInit(entityForm: any) {
  }
}
