import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import helptext from '../../../../helptext/directoryservice/kerberoskeytabs-form-list';

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
      name: helptext.kkt_ktname_name,
      placeholder: helptext.kkt_ktname_placeholder,
      tooltip: helptext.kkt_ktname_tooltip,
      required: true,
      validation : helptext.kkt_ktname_validation
    },
    {
      type: 'input',
      inputType: 'file',
      name: helptext.kkt_ktfile_name,
      placeholder: helptext.kkt_ktfile_placeholder,
      tooltip: helptext.kkt_ktfile_tooltip,
      fileType: 'binary',
      required: true,
      validation : helptext.kkt_ktfile_validation
    },
  ];

  constructor(protected rest: RestService, private router: Router) {}
}
