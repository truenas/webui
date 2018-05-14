import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-group-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class KerberosRealmsFormComponent {

  protected route_success: string[] = ['directoryservice', 'kerberosrealms'];
  protected resource_name = 'directoryservice/kerberosrealm';
  protected isEntity = true;
  protected isBasicMode = true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'krb_realm',
      placeholder: 'Realm',
      tooltip: 'Enter the name of the realm.',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      name: 'krb_kdc',
      placeholder: 'KDC',
      tooltip: 'Enter the name of the Key Distribution Center.'
    },
    {
      type: 'input',
      name: 'krb_admin_server',
      placeholder: 'Admin Server',
      tooltip: 'Define the server where all changes to the database are\
                performed.'
    },
    {
      type: 'input',
      name: 'krb_kpasswd_server',
      placeholder: 'Password Server',
      tooltip: 'Define the server where all password changes are\
                performed.'
    },
  ];

  protected advanced_field: Array < any > = [
    'krb_kdc',
    'krb_admin_server',
    'krb_kpasswd_server',
  ];

  public custActions: Array < any > = [{
      id: 'basic_mode',
      name: 'Basic Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id': 'advanced_mode',
      name: 'Advanced Mode',
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(protected rest: RestService, private router: Router) {}

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

}
