import { Component } from '@angular/core';
import helptext from 'app/helptext/directory-service/kerberos-settings';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'directoryservice-kerberossettings',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class KerberosSettingsComponent implements FormConfiguration {
  title = helptext.ks_label;
  queryCall: 'kerberos.config' = 'kerberos.config';
  addCall: 'kerberos.update' = 'kerberos.update';
  editCall: 'kerberos.update' = 'kerberos.update';
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.ks_label,
      class: 'heading',
      label: false,
      config: [
        {
          type: 'textarea',
          name: helptext.ks_appdefaults_name,
          placeholder: helptext.ks_appdefaults_placeholder,
          tooltip: helptext.ks_appdefaults_tooltip,
        },
        {
          type: 'textarea',
          name: helptext.ks_libdefaults_name,
          placeholder: helptext.ks_libdefaults_placeholder,
          tooltip: helptext.ks_libdefaults_tooltip,
        },
      ],
    },
  ];
}
