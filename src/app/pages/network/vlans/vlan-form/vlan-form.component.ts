import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { NetworkService, RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/network/vlans/vlans';

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
      placeholder : helptext.vlan_vint_placeholder,
      tooltip: helptext.vlan_vint_tooltip,
      required: true,
      validation: helptext.vlan_vint_validation
    },
    {
      type: 'select',
      name: 'vlan_pint',
      placeholder: helptext.vlan_pint_placeholder,
      tooltip: helptext.vlan_pint_tooltip,
      options: [],
      required: true,
      validation: helptext.vlan_pint_validation
    },
    {
      type: 'input',
      name: 'vlan_tag',
      placeholder: helptext.vlan_tag_placeholder,
      tooltip: helptext.vlan_tag_tooltip,
      required: true,
      validation: helptext.vlan_tag_validation
    },
    {
      type: 'input',
      name: 'vlan_description',
      placeholder: helptext.vlan_description_placeholder,
      tooltip: helptext.vlan_description_tooltip,
    },
    {
      type: 'select',
      name: 'vlan_pcp',
      placeholder: helptext.vlan_pcp_placeholder,
      options: [],
      tooltip: helptext.vlan_pcp_tooltip
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
