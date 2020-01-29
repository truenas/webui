import { Component } from '@angular/core';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/directoryservice/idmap';

@Component({
  selector: 'app-idmap-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class IdmapFormComponent {

  protected route_success: string[] = ['account', 'groups'];
  protected isEntity: boolean = true;
  protected namesInUse = [];
  protected queryCall = 'idmap.query';

  protected fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay  = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: "Idmap stuff",
      class: 'idmap-configuration-form',
      label:true,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.idmap.name.placeholder,
          tooltip: helptext.idmap.name.tooltip,
          required: true,
        },
        {
          type:  'input' ,
          name: 'dns_domain_name',
          placeholder: helptext.idmap.dns_domain_name.placeholder,
          tooltip: helptext.idmap.dns_domain_name.tooltip,
        },
        {
          type:  'input' ,
          name: 'range_low',
          inputType: 'number',
          placeholder: helptext.idmap.range_low.placeholder,
          tooltip: helptext.idmap.range_low.tooltip,
        },
        {
          type:  'input' ,
          name: 'range_high',
          inputType: 'number',
          placeholder: helptext.idmap.range_high.placeholder,
          tooltip: helptext.idmap.range_high.tooltip,
        },
        {
          type: 'select',
          name: 'idmap_backend',
          placeholder: helptext.idmap.idmap_backend.placeholder,
          tooltip: helptext.idmap.idmap_backend.tooltip,
          options: helptext.idmap.idmap_backend.enum
        },
        {
          type:  'select' ,
          name: 'certificate_id',
          placeholder: helptext.idmap.certificate_id.placeholder,
          tooltip: helptext.idmap.certificate_id.tooltip
        },

      ]
    }
  ]

  constructor() { }


}
