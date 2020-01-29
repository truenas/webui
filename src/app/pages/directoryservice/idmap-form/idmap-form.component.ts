import { Component } from '@angular/core';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'app-idmap-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class IdmapFormComponent {

  protected route_success: string[] = ['account', 'groups'];
  protected isEntity: boolean = true;
  protected namesInUse = [];
  protected queryCall = 'group.query';

  protected fieldConfig: FieldConfig[] = [];

  public fieldSetDisplay  = 'default';
  protected fieldSets: FieldSet[] = [
    {
      name: "Idmap stu;;",
      class: 'idmap-configuration-form',
      label:true,
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: 'Name',
          tooltip: "Put name here.",
          required: true,
        },
        {
          type: 'checkbox',
          name: 'test',
          placeholder: 'Test',
          tooltip: 'Check it',
        },
      ]
    }
  ]

  constructor() { }


}
