import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { Validators } from '@angular/forms';

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
      tooltip: 'Enter a name for this Keytab.',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      inputType: 'file',
      name: 'keytab_file',
      placeholder: 'Kerberos Keytab',
      tooltip: 'Browse to the keytab file to upload.',
      fileType: 'binary',
      required: true,
      validation : [ Validators.required ]
    },
  ];

  constructor(protected rest: RestService, private router: Router) {}
}
