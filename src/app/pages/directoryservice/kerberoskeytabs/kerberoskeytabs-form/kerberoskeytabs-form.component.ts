import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-kerberos-keytbas-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class KerberosKeytabsFormComponent {

  protected route_success: string[] = ['directoryservice', 'kerberoskeytabs'];
  protected resource_name = 'directoryservice/kerberoskeytab';
  protected isEntity =  true;

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'keytab_name',
      placeholder: 'Name',
      required: true
    },
    {
      type: 'input',
      inputType: 'file',
      name: 'keytab_file',
      placeholder: 'Kerberos Keytab',
      fileType: 'binary',
      required: true
    },
  ];

  constructor(protected rest: RestService, private router: Router) {}
}
