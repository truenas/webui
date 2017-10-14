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
      value: 'InfluxDB'
    },{
      type : 'input',
      name : 'username',
      placeholder: 'username'
    },{
      type : 'input',
      name : 'password',
      placeholder: 'password'
    },{
      type : 'input',
      name : 'host',
      placeholder: 'host'
    },{
      type : 'input',
      name : 'database',
      placeholder: 'database'
    },{
      type : 'input',
      name : 'series_name',
      placeholder: 'series_name'
    },
    {
      type : 'checkbox',
      name : 'enabled',
      placeholder : 'Enabled'
    },
  ];

  resource_transformIncommingRestData(data:any): any {

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
