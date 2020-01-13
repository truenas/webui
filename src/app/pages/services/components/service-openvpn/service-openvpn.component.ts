import { Component, OnInit } from '@angular/core';

import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import helptext from 'app/helptext/services/components/service-openvpn';


@Component({
  selector: 'openvpn-edit',
  template: ` <entity-form [conf]="this"></entity-form>`,
})

export class ServiceOpenvpnComponent implements OnInit {

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.client.header,
      label: true,
      config: [
        {
          type : 'checkbox',
          name : 'intdesc',
          placeholder : 'OpenVPN checkbox',
          tooltip: 'OpenVPN tooltip',
        }
      ]
    },
    {
      name:'divider',
      divider:true
    },
    {
      name: helptext.server.header,
      label: true,
      config: [
        {
          type : 'checkbox',
          name : 'intdesc',
          placeholder : 'OpenVPN checkbox',
          tooltip: 'OpenVPN tooltip',
        }
      ]
    }
  ];

  constructor() { }

  ngOnInit() {
  }

}
