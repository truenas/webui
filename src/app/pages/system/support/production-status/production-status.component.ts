import { Component, OnInit } from '@angular/core';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-production-status',
  template : `<entity-form [conf]="this"></entity-form>`,
  styleUrls: ['./production-status.component.css']
})
export class ProductionStatusComponent implements OnInit {
  public fieldConfig: FieldConfig[] = []
  public fieldSets: FieldSet[] = [
    {
      name: 'Column 1',
      label: false,
      config:[
        {
          type: 'checkbox',
          name: 'TN_is_production',
          placeholder: helptext.is_production_checkbox.placeholder,
          tooltip: helptext.is_production_checkbox.tooltip
        },
        {
          type: 'checkbox',
          name: 'TN_send_debug',
          placeholder: 'Send initial debug',
          tooltip: 'Send initial debug.',
          value: false,
          relation : [
            {
              action : 'SHOW',
              when : [ {
                name : 'TN_is_production',
                value : true,
              } ]
            },
          ]
        },
      ]
    }
  ]

  constructor() { }

  ngOnInit() {
  }

}
