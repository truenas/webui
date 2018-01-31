import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Wizard } from '../../common/entity/entity-form/models/wizard.interface';
import { EntityWizardComponent } from '../../common/entity/entity-wizard/entity-wizard.component';

@Component({
  selector: 'jail-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>'
})
export class JailWizardComponent {

  isLinear = false;
  firstFormGroup: FormGroup;

  protected wizardConfig: Wizard[] = [{
      label: 'Plese fill Jail Info',
      fieldConfig: [{
          type: 'input',
          name: 'uuid',
          placeholder: 'Jails Name',
          tooltip: 'Mandatory. Can only contain letters, numbers, dashes,\
 or the underscore character.',
        },
        {
          type: 'select',
          name: 'release',
          placeholder: 'Release',
          tooltip: 'Select the release for the jail.',
          options: [],
        },
      ]
    },
    {
      label: 'Plese fill Config Jail Network',
      fieldConfig: [{
          type: 'input',
          name: 'ip4_addr',
          placeholder: 'IPv4 Address',
          tooltip: 'This and the other IPv4 settings are grayed out if\
 <b>IPv4 DHCP</b> is checked. Enter a unique IP address that is in the\
 local network and not already used by any other computer.',
        },
        {
          type: 'input',
          name: 'defaultrouter',
          placeholder: 'Default Router',
        },
        {
          type: 'input',
          name: 'ip6_addr',
          placeholder: 'IPv6 Address',
          tooltip: 'This and other IPv6 settings are grayed out if\
 <b>IPv6 Autoconfigure</b> is checked; enter a unique IPv6 address that\
 is in the local network and not already used by any other computer',
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: 'Default Router For IPv6',
        },
        {
          type: 'input',
          name: 'notes',
          placeholder: 'Note',
        },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: 'Vnet',
        }
      ]
    },
  ]

  constructor(protected rest: RestService, protected ws: WebSocketService) {

  }

}
