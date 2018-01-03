import { Component, Injector } from '@angular/core';
import { Subscription } from 'rxjs';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'directoryservice-kerberossettings',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class KerberosSettingsComponent {

  protected resource_name: string = 'directoryservice/kerberossettings/';

  public fieldConfig: FieldConfig[] = [{
      type: 'textarea',
      name: 'ks_appdefaults_aux',
      placeholder: 'Appdefaults Auxiliary Parameters',
    },
    {
      type: 'textarea',
      name: 'ks_libdefaults_aux',
      placeholder: 'Libdefaults Auxiliary Parameters'
    }
  ];
}
