import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { Validators } from '@angular/forms';

import { T } from '../../../../translate-marker';

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
      placeholder: T('Name'),
      tooltip: T('Enter a name for this Keytab.'),
      required: true,
      validation : [ Validators.required ]
    },
    {
      type: 'input',
      inputType: 'file',
      name: 'keytab_file',
      placeholder: T('Kerberos Keytab'),
      tooltip: T('Browse to the keytab file to upload.'),
      fileType: 'binary',
      required: true,
      validation : [ Validators.required ]
    },
  ];

  constructor(protected rest: RestService, private router: Router) {}
}
