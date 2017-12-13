import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  protected route_success: string[] = ['storage', 'disks'];
  protected resource_name: string = 'storage/disk/';
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: 'Name',
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_serial',
      placeholder: 'Serial',
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_description',
      placeholder: 'Description',
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
      placeholder: 'HDD Standby',
      options: [],
    },
    {
      type: 'select',
      name: 'disk_advpowermgmt',
      placeholder: 'Advanced Power Management',
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: 'Acoustic Level',
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : 'Enable S.M.A.R.T.',
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: 'S.M.A.R.T. extra options',
    }
  ];

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;

  constructor(
    private _router: Router,
    protected rest: RestService,
    protected ws: WebSocketService
  ) {}

  afterInit(entityEdit: any) {
    this.ws.call('notifier.choices', ['HDDSTANDBY_CHOICES']).subscribe((res) => {
      this.disk_hddstandby = _.find(this.fieldConfig, {name : 'disk_hddstandby'});
      res.forEach((item) => {
        this.disk_hddstandby.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['ADVPOWERMGMT_CHOICES']).subscribe((res) => {
      this.disk_advpowermgmt = _.find(this.fieldConfig, {name : 'disk_advpowermgmt'});
      res.forEach((item) => {
        this.disk_advpowermgmt.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['ACOUSTICLVL_CHOICES']).subscribe((res) => {
      this.disk_acousticlevel = _.find(this.fieldConfig, {name : 'disk_acousticlevel'});
      res.forEach((item) => {
        this.disk_acousticlevel.options.push(
            {label : item[1], value : item[0]});
      });
    });
  }
}
