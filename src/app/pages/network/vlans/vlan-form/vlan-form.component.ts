import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';

import {
  NetworkService,
  RestService,
  WebSocketService
} from '../../../../services/';
import {
  FieldConfig
} from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector : 'app-vlan-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class VlanFormComponent {

  protected resource_name: string = 'network/vlan/';
  protected route_success: string[] = [ 'network', 'vlans' ];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'vlan_vint',
      placeholder : 'Virtual Interface',
      tooltip : 'Use the format <i>vlanX</i> where <i>X</i> is a number\
 representing a vlan interface not currently being used as a parent.',
    },
    {
      type : 'select',
      name : 'vlan_pint',
      placeholder : 'Parent Interface',
      tooltip : 'Usually an ethernet card connected to a properly\
 configured switch port. Note that newly created link aggreagations\
 will not appear in the drop-down until the system is rebooted.',
      options : []
    },
    {
      type : 'input',
      name : 'vlan_tag',
      placeholder : 'Vlan Tag',
      tooltip : 'Number between 1 and 4095 which matches a numeric tag\
 set up in the switched network.',
    },
    {
      type : 'input',
      name : 'vlan_description',
      placeholder : 'Description',
      tooltip : 'Optional.',
    },
    {
      type : 'select',
      name : 'vlan_pcp',
      placeholder : 'Priority Code Point',
      options: [],
      tooltip: 'Available 802.1p Class of Service ranges from Best Effort (default) to Network Control (highest'
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
