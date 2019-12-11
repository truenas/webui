import { Component } from '@angular/core';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/directoryservice/kerberossettings';

@Component({
  selector: 'directoryservice-kerberossettings',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class KerberosSettingsComponent {

  protected queryCall = 'kerberos.config';
  protected addCall = 'kerberos.update';
  protected editCall = 'kerberos.update';
  protected isEntity = true;

  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: helptext.ks_label,
      class: 'heading',
      label:true,
      config:[
        {
          type: 'textarea',
          name: helptext.ks_appdefaults_name,
          placeholder: helptext.ks_appdefaults_placeholder,
          tooltip: helptext.ks_appdefaults_tooltip
        },
        {
          type: 'textarea',
          name: helptext.ks_libdefaults_name,
          placeholder: helptext.ks_libdefaults_placeholder,
          tooltip: helptext.ks_libdefaults_tooltip
        }
      ]
    }
  ];
  
  resourceTransformIncomingRestData(data) {
    return data;
  }
}
