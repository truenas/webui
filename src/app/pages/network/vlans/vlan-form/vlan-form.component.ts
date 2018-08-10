import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Validators} from '@angular/forms';
import {
  regexValidator
} from '../../../common/entity/entity-form/validators/regex-validation';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

import { T } from '../../../../translate-marker';

@Component({
  selector : 'app-vlan-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VlanFormComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_success: string[] = [ 'network', 'vlans' ];
  protected isEntity: boolean = true;
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Save VLAN Interface Changes"),
    message: T("Network connectivity will be interrupted. Proceed?"),
    hideCheckbox: false
  }

  public fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'vlan_vint',
      placeholder : T('Virtual Interface'),
      tooltip: T('Enter the name of the Virtual Interface. Use the\
                  format <i>vlanX</i> where <i>X</i> is a number\
                  representing a non-parent VLAN interface.'),
      required: true,
      validation: [ Validators.required ]
    },
    {
      type: 'select',
      name: 'vlan_pint',
      placeholder: T('Parent Interface'),
      tooltip: T('Select the VLAN Parent Interface. Usually an Ethernet\
                  card connected to a configured switch port. Newly\
                  created link aggregations will not be available until\
                  the system is rebooted.'),
      options: [],
      required: true,
      validation: [ Validators.required ]
    },
    {
      type: 'input',
      name: 'vlan_tag',
      placeholder: T('Vlan Tag'),
      tooltip: T('Enter the numeric tag configured in the switched \
                  network.'),
      required: true,
      validation: [Validators.min(1), Validators.max(4095), Validators.required, regexValidator(/^\d+$/)]
    },
    {
      type: 'input',
      name: 'vlan_description',
      placeholder: T('Description'),
      tooltip: T('Enter a description of the VLAN.'),
    },
    {
      type: 'select',
      name: 'vlan_pcp',
      placeholder: T('Priority Code Point'),
      options: [],
      tooltip: T('Select the Class of Service. The available 802.1p\
                  Class of Service ranges from <i>Best effort (default)\
                  </i> to <i>Network control (highest)</i>.'),
    }
  ];

  private vlan_pint: any;
  private vlan_pcp: any;

  constructor(protected router: Router, protected rest: RestService,
              protected ws: WebSocketService,
              protected route: ActivatedRoute,
              protected networkService: NetworkService) {}

  preInit(entityForm: any) {
    this.vlan_pint = _.find(this.fieldConfig, {'name' : 'vlan_pint'});
    this.route.params.subscribe(params => {
      if(params['pk']) {
        this.vlan_pint.type = 'input';
        this.confirmSubmit = true;
      }
    });
  }

  afterInit(entityForm: any) {

    this.ws.call('notifier.choices', ['VLAN_PCP_CHOICES']).subscribe((res) => {
      this.vlan_pcp = _.find(this.fieldConfig, {'name' : 'vlan_pcp'});
      res.forEach((item) => {
        this.vlan_pcp.options.push({label : item[1], value : item[0]});
      });
    });

    if (!entityForm.isNew) {
      entityForm.setDisabled('vlan_vint', true);
      entityForm.setDisabled('vlan_pint', true);
    } else {
      this.networkService.getVlanNicChoices().subscribe((res) => {
        res.forEach((item) => {
          this.vlan_pint.options.push({label : item[1], value : item[0]});
        });
      });
    }
  }
}
