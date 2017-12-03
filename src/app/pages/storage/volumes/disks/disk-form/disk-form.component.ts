import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../../services/';
import { FieldConfig } from '../../../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  protected route_success: string[] = ['storage', 'volumes'];
  protected resource_name: string = 'storage/disk/';

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: 'Name',
    },
    {
      type: 'input',
      name: 'disk_serial',
      placeholder: 'Serial',
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
      value : true,
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: 'S.M.A.R.T. extra options',
    }
  ];

  constructor(
    private _router: Router
  ) {}
}
