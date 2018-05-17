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
      tooltip: 'Define any additional settings for use by some Kerberos\
                applications. The available settings and syntax is\
                listed in the <a\
                href="http://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html#appdefaults"\
                target="_blank">appdefaults section of krb.conf(5).</a>.',
    },
    {
      type: 'textarea',
      name: 'ks_libdefaults_aux',
      placeholder: 'Libdefaults Auxiliary Parameters',
      tooltip: 'Define any settings used by the Kerberos library. The\
                available settings and their syntax are listed in the\
                <a href="http://web.mit.edu/kerberos/krb5-1.12/doc/admin/conf_files/krb5_conf.html#libdefaults"\
                target="_blank">libdefaults section of krb.conf(5).</a>.',

    }
  ];
}
