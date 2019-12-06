import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/directoryservice/kerberosrealms-form-list';

@Component({
  selector: 'app-group-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class KerberosRealmsFormComponent {

  protected route_success: string[] = ['directoryservice', 'kerberosrealms'];
  protected addCall = 'kerberos.realm.create';
  protected editCall = 'kerberos.realm.update';
  protected queryCall = 'kerberos.realm.query';
  protected pk: any;
  protected queryKey = 'id';
  protected isEntity = true;
  protected isBasicMode = true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: helptext.krbrealm_form_realm_name,
      placeholder: helptext.krbrealm_form_realm_placeholder,
      tooltip: helptext.krbrealm_form_realm_tooltip,
      required: true,
      validation : helptext.krbrealm_form_realm_validation
    },
    {
      type: 'input',
      name: helptext.krbrealm_form_kdc_name,
      placeholder: helptext.krbrealm_form_kdc_placeholder,
      tooltip: helptext.krbrealm_form_kdc_tooltip
    },
    {
      type: 'input',
      name: helptext.krbrealm_form_admin_server_name,
      placeholder: helptext.krbrealm_form_admin_server_placeholder,
      tooltip: helptext.krbrealm_form_admin_server_tooltip
    },
    {
      type: 'input',
      name: helptext.krbrealm_form_kpasswd_server_name,
      placeholder: helptext.krbrealm_form_kpasswd_server_placeholder,
      tooltip: helptext.krbrealm_form_kpasswd_server_tooltip
    },
  ];

  protected advanced_field: Array < any > = helptext.krbrealm_form_advanced_field_array;

  public custActions: Array < any > = [{
      id: helptext.krbrealm_form_custactions_basic_id,
      name: helptext.krbrealm_form_custactions_basic_name,
      function: () => { this.isBasicMode = !this.isBasicMode; }
    },
    {
      'id': helptext.krbrealm_form_custactions_adv_id,
      name: helptext.krbrealm_form_custactions_adv_name,
      function: () => { this.isBasicMode = !this.isBasicMode; }
    }
  ];

  constructor(private router: Router) {}

  isCustActionVisible(actionId: string) {
    if (actionId === 'advanced_mode' && this.isBasicMode === false) {
      return false;
    } else if (actionId === 'basic_mode' && this.isBasicMode === true) {
      return false;
    }
    return true;
  }

}
