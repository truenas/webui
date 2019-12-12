import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { NetworkService, RestService, DialogService, WebSocketService } from '../../../../services';

import { T } from '../../../../translate-marker';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import helptext from '../../../../helptext/network/interfaces/interfaces-form';
import { CoreService } from 'app/core/services/core.service';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import globalHelptext from '../../../../helptext/global-helptext';

@Component({
  selector : 'app-interfaces-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent extends ViewControllerComponent implements OnDestroy {
  protected queryCall = 'interface.query';
  protected addCall = 'interface.create';
  protected editCall = 'interface.update';
  protected queryKey = 'id';
  protected route_success: string[] = [ 'network', 'interfaces' ];
  protected isEntity = true;
  protected is_ha = false;
  private aliases_fc: any;
  protected ipPlaceholder: string;
  protected failoverPlaceholder: string;
  protected saveSubmitText = helptext.int_save_button;

  public fieldConfig: FieldConfig[] = [
    {
      type : 'select',
      name : 'type',
      placeholder: helptext.int_type_placeholder,
      tooltip: helptext.int_type_tooltip,
      required: true,
      options: helptext.int_type_options
    },
    {
      type : 'input',
      name : 'name',
      placeholder : helptext.int_name_placeholder,
      tooltip : helptext.int_name_tooltip,
      required: true,
      validation : helptext.int_name_validation
    },
    {
      type: 'input',
      name: 'description',
      placeholder: helptext.int_description_placeholder,
      tooltip: helptext.int_description_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ipv4_dhcp',
      placeholder : helptext.int_dhcp_placeholder,
      tooltip : helptext.int_dhcp_tooltip,
    },
    {
      type : 'checkbox',
      name : 'ipv6_auto',
      placeholder : helptext.int_ipv6auto_placeholder,
      tooltip : helptext.int_ipv6auto_tooltip
    },
    {
      type : 'checkbox',
      name: 'disable_offload_capabilities',
      placeholder : helptext.disable_offload_capabilities_placeholder,
      tooltip : helptext.disable_offload_capabilities_tooltip,
    },
    {
      type: 'select',
      name: 'bridge_members',
      placeholder: helptext.bridge_members_placeholder,
      tooltip: helptext.bridge_members_tooltip,
      multiple: true,
      options: [],
      isHidden: true,
      disabled: true,
    },
    {
      type : 'select',
      name : 'lag_protocol',
      placeholder : helptext.lagg_protocol_placeholder,
      tooltip : helptext.lagg_protocol_tooltip,
      options : helptext.lagg_protocol_options,
      required: true,
      isHidden: true,
      disabled: true,
      validation : helptext.lagg_protocol_validation,
      value: "NONE"
    },
    {
      type : 'select',
      name : 'lag_ports',
      placeholder : helptext.lagg_interfaces_placeholder,
      tooltip : helptext.lagg_interfaces_tooltip,
      options : [],
      multiple : true,
      required: true,
      isHidden: true,
      disabled: true,
      validation : helptext.lagg_interfaces_validation,
    },
    {
      type: 'checkbox',
      name: 'failover_critical',
      placeholder: helptext.failover_critical_placeholder,
      tooltip: helptext.failover_critical_tooltip,
      isHidden: true,
      disabled: true,
    },
    {
      type: 'select',
      name: 'failover_group',
      placeholder: helptext.failover_group_placeholder,
      tooltip: helptext.failover_group_tooltip,
      isHidden: true,
      disabled: true,
      options: [{label: '---', value: null}]
    },
    {
      type: 'input',
      name: 'failover_vhid',
      placeholder: helptext.failover_vhid_placeholder,
      tooltip: helptext.failover_vhid_tooltip,
      isHidden: true,
      disabled: true,
    },
    {
      type: 'select',
      name: 'vlan_parent_interface',
      placeholder: helptext.vlan_pint_placeholder,
      tooltip: helptext.vlan_pint_tooltip,
      options: [],
      required: true,
      isHidden: true,
      disabled: true,
      validation: helptext.vlan_pint_validation
    },
    {
      type: 'input',
      name: 'vlan_tag',
      placeholder: helptext.vlan_tag_placeholder,
      tooltip: helptext.vlan_tag_tooltip,
      required: true,
      isHidden: true,
      disabled: true,
      validation: helptext.vlan_tag_validation
    },
    {
      type: 'select',
      name: 'vlan_pcp',
      placeholder: helptext.vlan_pcp_placeholder,
      options: helptext.vlan_pcp_options,
      tooltip: helptext.vlan_pcp_tooltip,
      isHidden: true,
      disabled: true,
    },
    {
      type: 'input',
      name: 'mtu',
      placeholder: helptext.mtu_placeholder,
      tooltip: helptext.mtu_tooltip,
      validation: helptext.mtu_validation,
    },
    {
      type : 'input',
      name : 'options',
      placeholder : helptext.int_options_placeholder,
      tooltip : helptext.int_options_tooltip,
    },
    {
      type: 'list',
      name: 'aliases',
      placeholder: helptext.alias_list_placeholder,
      label: helptext.alias_list_label,
      templateListField: [
          {
            name: 'address',
            placeholder: helptext.alias_address_placeholder,
            tooltip: helptext.alias_address_tooltip,
            type: 'ipwithnetmask',
            width: '55%',
            validation : [ regexValidator(this.networkService.ipv4_or_ipv6_cidr_or_none) ],
          },
          {
            name: 'failover_address',
            placeholder: helptext.failover_alias_address_placeholder,
            tooltip: helptext.failover_alias_address_tooltip,
            disabled: true,
            isHidden: true,
            type: 'ipwithnetmask',
            width: '55%',
            validation : [ regexValidator(this.networkService.ipv4_or_ipv6_cidr_or_none) ],
          },
          {
            name: 'failover_virtual_address',
            placeholder: helptext.failover_virtual_alias_address_placeholder,
            tooltip: helptext.failover_virtual_alias_address_tooltip,
            disabled: true,
            isHidden: true,
            type: 'ipwithnetmask',
            width: '55%',
            netmaskPreset: 32,
            validation : [ regexValidator(this.networkService.ipv4_or_ipv6_cidr_or_none) ],

          }
      ],
      listFields: []
    }
  ];

  private vlan_fields = ['vlan_tag', 'vlan_pcp', 'vlan_parent_interface'];
  private lagg_fields = ['lag_protocol', 'lag_ports'];
  private bridge_fields = ['bridge_members'];
  private failover_fields = ['failover_critical', 'failover_group', 'failover_vhid'];
  private vlan_pcp:any;
  private vlan_pint:any;
  private lag_ports: any;
  private bridge_members: any;
  private type: any;
  private type_fg: any;
  private type_subscription: any;
  private entityForm: any;
  //
  protected ipListControl: any;
  protected failover_group: any;
  //
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Save Network Interface Changes"),
    message: T("Network connectivity will be interrupted. Proceed?"),
    hideCheckbox: false
  }

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected entityFormService: EntityFormService,
              protected networkService: NetworkService, protected dialog: DialogService,
              protected ws: WebSocketService, protected translate: TranslateService) {
    super();
  }

  setType(type: string) {
    const is_physical = (type === "PHYSICAL");
    const is_vlan = (type === "VLAN");
    const is_bridge = (type === "BRIDGE");
    const is_lagg = (type === "LINK_AGGREGATION");
    for (let i = 0; i < this.vlan_fields.length; i++) {
      this.entityForm.setDisabled(this.vlan_fields[i], !is_vlan, !is_vlan);
    }
    for (let i = 0; i < this.lagg_fields.length; i++) {
      this.entityForm.setDisabled(this.lagg_fields[i], !is_lagg, !is_lagg);
    }
    for (let i = 0; i < this.vlan_fields.length; i++) {
      this.entityForm.setDisabled(this.bridge_fields[i], !is_bridge, !is_bridge);
    }

  }

  preInit(entityForm: any) {
    this.entityForm = entityForm;
    this.type = _.find(this.fieldConfig, {'name' : 'type'});
    this.ipListControl = _.find(this.fieldConfig, {'name' : 'aliases'});
    this.failover_group = _.find(this.fieldConfig, {'name': 'failover_group'});
    for (let i = 1; i <= 32; i++) {
      this.failover_group.options.push({label:i, value:i});
    }

    this.vlan_pint = _.find(this.fieldConfig, {'name' : 'vlan_parent_interface'});
    this.bridge_members = _.find(this.fieldConfig, {'name' : 'bridge_members'});
    this.lag_ports = _.find(this.fieldConfig, {'name' : 'lag_ports'});

    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.node').subscribe((node) => {
        if (node === 'A') {
          this.ipPlaceholder = ` (${globalHelptext.thisCtlr})`;
          this.failoverPlaceholder = ` (${globalHelptext.Ctrlr} 2)`;
        } else if (node === 'B') {
          this.ipPlaceholder = ` (${globalHelptext.Ctrlr} 1)`;
          this.failoverPlaceholder = ` (${globalHelptext.thisCtlr})`;
        } else {
          this.ipPlaceholder = ` ${globalHelptext.unknownCtrl}`;
          this.failoverPlaceholder = ''
        }
        _.find(this.ipListControl.templateListField, {'name': 'address'}).placeholder += this.ipPlaceholder;
        _.find(this.ipListControl.templateListField, {'name': 'failover_address'}).placeholder += this.failoverPlaceholder;
      })
    }
  }

  afterInit(entityForm: any) {
    if (window.localStorage.getItem('is_freenas') === 'false' &&
      window.localStorage.getItem('alias_ips') === 'show') {
        const failover_virtual_address = _.find(this.ipListControl.templateListField, {"name":"failover_virtual_address"});
        const failover_address = _.find(this.ipListControl.templateListField, {'name': 'failover_address'});
        failover_virtual_address['disabled'] = false;
        failover_virtual_address['isHidden'] = false;
        failover_address['disabled'] = false;
        failover_address['isHidden'] = false;


      }
    this.aliases_fc = _.find(this.fieldConfig, {"name": "aliases"});

    if (window.localStorage.getItem('is_freenas') === 'false') {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        for (let i = 0; i < this.failover_fields.length; i++) {
          entityForm.setDisabled(this.failover_fields[i], !is_ha, !is_ha);
        }
      });
    }
    if (entityForm.isNew) {
      this.type_fg = entityForm.formGroup.controls['type'];
      this.type_subscription = this.type_fg.valueChanges.subscribe((type) => {
        this.setType(type);
      });
      this.networkService.getVlanParentInterfaceChoices().subscribe((res) => {
        for (const key in res) {
          this.vlan_pint.options.push({label: res[key], value: key});
        }
      });
      this.networkService.getLaggPortsChoices().subscribe((res) => {
        for (const key in res) {
          this.lag_ports.options.push({label: res[key], value: key});
        }
      });
      this.networkService.getBridgeMembersChoices().subscribe((res) => {
        for (const key in res) {
          this.bridge_members.options.push({label: res[key], value: key});
        }
      });
    } else {
      entityForm.setDisabled('name', true);
      entityForm.setDisabled('type', true, true);
    }
  }

  clean(data) {
    const aliases = [];
    const failover_aliases = [];
    const failover_virtual_aliases = [];
    for (let i = 0; i < data.aliases.length; i++) {
      if (!data.aliases[i]['delete'] &&
          !!data.aliases[i]['address']) {
        const strings = data.aliases[i]['address'].split('/');
        if (strings[0]) {
          aliases.push({address:strings[0],
                        netmask:parseInt(strings[1],10)});
        }
        if (!!data.aliases[i]['failover_address'] &&
            !!data.aliases[i]['failover_virtual_address']) {
          const f_strings = data.aliases[i]['failover_address'].split('/');
          if (f_strings[0]) {
            failover_aliases.push({address:f_strings[0],
                          netmask:parseInt(f_strings[1],10)});
          }
          const fv_strings = data.aliases[i]['failover_virtual_address'].split('/');
          if (fv_strings[0]) {
            failover_virtual_aliases.push({address:fv_strings[0],
                          netmask:parseInt(fv_strings[1],10)});
          }
        }
      }
    }

    data.aliases = aliases;
    if (failover_aliases.length > 0) {
      data.failover_aliases = failover_aliases;
    }
    if (failover_virtual_aliases.length > 0) {
      data.failover_virtual_aliases = failover_virtual_aliases;
    }
    return data;
  }

  resourceTransformIncomingRestData(data) {
    const aliases = data['aliases'];
    const a = [];
    const failover_aliases = data['failover_aliases'];
    const failover_virtual_aliases = data['failover_virtual_aliases'];
    for (let i = 0; i < aliases.length; i++) {
      a[i] = {};
      a[i].address = aliases[i].address + '/' + aliases[i].netmask;
      if (failover_aliases && failover_aliases[i]) {
        a[i].failover_address = failover_aliases[i].address + '/' + failover_aliases[i].netmask;
      }
      if (failover_virtual_aliases && failover_virtual_aliases[i]) {
        a[i].failover_virtual_address = failover_virtual_aliases[i].address + '/' + failover_virtual_aliases[i].netmask
      }
    }
    data['aliases'] = a;

    const type = data['type'];
    const id = data['id'];
    this.setType(type);
    if (type === "LINK_AGGREGATION") {
      this.networkService.getLaggPortsChoices(id).subscribe((res) => {
        for (const key in res) {
          this.lag_ports.options.push({label: res[key], value: key});
        }
      });
    } else if (type === "BRIDGE") {
      this.networkService.getBridgeMembersChoices(id).subscribe((res) => {
        for (const key in res) {
          this.bridge_members.options.push({label: res[key], value: key});
        }
      });
    } else if (type === "VLAN") {
      this.entityForm.setDisabled('vlan_parent_interface', true);
    }

    return data;
  }

  afterSave() {
    this.core.emit({name: "NetworkInterfacesChanged", data: {commit:false, checkin: false}, sender:this});
    this.router.navigate(new Array('/').concat(
      this.route_success));
  }

  ngOnDestroy() {
    if (this.type_subscription) {
      this.type_subscription.unsubscribe();
    }
  }
}
