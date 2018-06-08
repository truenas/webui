import {Component} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import * as _ from 'lodash';
import {Validators} from '@angular/forms';

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
    message: T("Network connectivity will be interrupted. Do you want to proceed?"),
    hideCheckbox: false
  }

  public fieldConfig: FieldConfig[] = [
    {
      type : 'input',
      name : 'vlan_vint',
      placeholder : 'Virtual Interface',
      tooltip : 'Use the format <i>vlanX</i> where <i>X</i> is a number\
                 representing a non-parent vlan interface.',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'select',
      name : 'vlan_pint',
      placeholder : 'Parent Interface',
      tooltip : 'Usually an ethernet card connected to a configured\
                 switch port. Newly created link aggregations\
                 will not appear until the system is rebooted.',
      options : [],
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'vlan_tag',
      placeholder : 'Vlan Tag',
      tooltip : 'Enter a number between 1 and 4095 which matches the\
                 numeric tag configured in the switched network.',
      required: true,
      validation : [ Validators.required ]
    },
    {
      type : 'input',
      name : 'vlan_description',
      placeholder : 'Description',
      tooltip : 'Enter any notes about this vlan.',
    },
    {
      type : 'select',
      name : 'vlan_pcp',
      placeholder : 'Priority Code Point',
      options: [],
      tooltip: 'Available 802.1p Class of Service ranges from\
                <i>Best Effort</i> to <i>Network Control</i>.'
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
