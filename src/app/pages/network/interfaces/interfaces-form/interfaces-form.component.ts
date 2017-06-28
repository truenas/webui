import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { RestService, NetworkService } from '../../../../services';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';

@Component({
  selector: 'app-interfaces-form',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent {

  protected resource_name: string = 'network/interface/';
  protected route_success: string[] = ['network', 'interfaces'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'int_interface',
      placeholder: 'Interface',
    },
    {
      type: 'input',
      name: 'int_name',
      placeholder: 'Name',
    },
    {
      type: 'input',
      name: 'int_ipv4address',
      placeholder: 'IPv4 Address',
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "int_dhcp",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'select',
      name: 'int_v4netmaskbit',
      placeholder: 'IPv4 Netmask',
      options: [],
      relation: [
        {
          action: "DISABLE",
          when: [
            {
              name: "int_dhcp",
              value: true
            }
          ]
        }
      ]
    },
    {
      type: 'checkbox',
      name: 'int_dhcp',
      placeholder: 'DHCP'
    },
    {
      type: 'input',
      name: 'int_options',
      placeholder: 'Options',
    },
  ];

  private int_v4netmaskbit: any;
  private int_interface: any;
  private entityForm: any;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected rest: RestService,
    protected networkService: NetworkService) {

  }

  preInit(entityForm: any) {
    this.int_interface = _.find(this.fieldConfig, {'name': 'int_interface'});
    if (entityForm.isNew) {
      this.int_interface.type = 'select';
      this.int_interface.options = [];
    }
  }

  afterInit(entityForm: any) {
    this.int_v4netmaskbit = _.find(this.fieldConfig, {'name': 'int_v4netmaskbit'});
    this.int_v4netmaskbit.options = this.networkService.getV4Netmasks()

    if (!entityForm.isNew) {
      entityForm.setDisabled('int_interface', true);
    } else {
      this.networkService.getInterfaceNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.int_interface.options.push({ label: item[1], value: item[0] });
        });
      });
    }
  }

}
