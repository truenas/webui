import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { FormArray } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { NetworkService, RestService, DialogService, WebSocketService } from '../../../../services';

import { T } from '../../../../translate-marker';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { EntityFormService } from '../../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../../common/entity/utils';
import helptext from '../../../../helptext/network/interfaces/interfaces-form';

@Component({
  selector : 'app-interfaces-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class InterfacesFormComponent implements OnDestroy {

  //protected resource_name = 'network/interface/';
  protected queryCall = 'interface.query';
  protected addCall = 'interface.create';
  protected editCall = 'interface.update';
  protected queryKey = 'id';
  protected route_success: string[] = [ 'network', 'interfaces' ];
  protected isEntity = true;

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
      type: 'input',
      name: 'failover_group',
      placeholder: helptext.failover_group_placeholder,
      tooltip: helptext.failover_group_tooltip,
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
      options: [],
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
      type: 'array',
      name : 'ipv4_aliases',
      initialCount: 1,
      formarray: [{
        name: 'address',
        placeholder: helptext.alias_address_placeholder,
        tooltip: helptext.alias_address_tooltip,
        type: 'ipwithnetmask',
        validation : [ regexValidator(this.networkService.ipv4_or_ipv6_cidr) ]
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: helptext.delete_placeholder,
        tooltip: helptext.delete_tooltip,
      }]
    },
    {
      type: 'array',
      name : 'ipv6_aliases',
      initialCount: 1,
      formarray: [{
        name: 'address',
        placeholder: helptext.alias_address6_placeholder,
        tooltip: helptext.alias_address6_tooltip,
        type: 'ipwithnetmask',
        validation : [ regexValidator(this.networkService.ipv4_or_ipv6_cidr) ]
      },
      {
        type: 'checkbox',
        name: 'delete',
        placeholder: helptext.delete_placeholder6,
        tooltip: helptext.delete_tooltip6,
      }]
    },
  ];

  private vlan_fields = ['vlan_tag', 'vlan_pcp', 'vlan_parent_interface'];
  private lagg_fields = ['lag_protocol', 'lag_ports'];
  private bridge_fields = ['bridge_members'];
  private failover_fields = ['failover_critical', 'failover_group'];
  private physical_fields;
  /*private int_dhcp: any;
  private int_dhcp_subscription: any;
  private int_ipv6auto: any;
  private int_ipv6auto_subscription: any;*/
  private vlan_pcp:any;
  private vlan_pint:any;
  private lag_protocol: any;
  private lag_ports: any;
  private bridge_members: any;
  private type: any;
  private type_fg: any;
  private type_subscription: any;
  /*private int_interface: any;
  private int_interface_fg: any;
  private int_interface_fg_sub: any;
  private int_interface_warning: string;*/
  private wsint: string;
  private entityForm: any;
  protected ipv4formArray: FormArray;
  protected ipv6formArray: FormArray;
  protected ipv6arrayControl: any;
  protected ipv4arrayControl: any;
  protected initialCount = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  protected initialCount_default = {'ipv4_aliases':1, 'ipv6_aliases': 1};
  public confirmSubmit = false;
  public confirmSubmitDialog = {
    title: T("Save Network Interface Changes"),
    message: T("Network connectivity will be interrupted. Proceed?"),
    hideCheckbox: false
  }

  public custActions: Array<any> = [
    {
      id : 'add_ipv4_alias',
      name : T('Add Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
            this.initialCount.ipv4_aliases, this.ipv4formArray, this.ipv4arrayControl.formarray);
      }
    },
    {
      id : 'remove_ipv4_alias',
      name : T('Remove Additional IPv4 Alias'),
      function : () => {
        this.initialCount.ipv4_aliases -= 1;
        this.entityFormService.removeFormArrayGroup(this.initialCount.ipv4_aliases,
                                                    this.ipv4formArray);
      }
    },
    {
      id : 'add_ipv6_alias',
      name : T('Add Additional IPv6 Alias'),
      function : () => {
        this.initialCount.ipv6_aliases += 1;
        this.entityFormService.insertFormArrayGroup(
          this.initialCount.ipv6_aliases, this.ipv6formArray, this.ipv6arrayControl.formarray);
        }
    },
    {
    id : 'remove_ipv6_alias',
    name : T('Remove Additional IPv6 Alias'),
    function : () => {
      this.initialCount.ipv6_aliases -= 1;
      this.entityFormService.removeFormArrayGroup(this.initialCount.ipv6_aliases,
                                                  this.ipv6formArray);
    }
  }];

  //int_warning = T("Please configure the Web UI interface (");
  //int_warning_2 = T(") before configuring other interfaces to avoid losing connection to the user interface.");

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected entityFormService: EntityFormService,
              protected networkService: NetworkService, protected dialog: DialogService,
              protected ws: WebSocketService, protected translate: TranslateService) {}

  isCustActionVisible(actionId: string) {
    if (actionId == 'remove_ipv4_alias' && this.initialCount['ipv4_aliases'] <= this.initialCount_default['ipv4_aliases']) {
      return false;
    }
    if (actionId == 'remove_ipv6_alias' && this.initialCount['ipv6_aliases'] <= this.initialCount_default['ipv6_aliases']) {
      return false;
    }
    return true;
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
    this.ipv4arrayControl = _.find(this.fieldConfig, {'name' : 'ipv4_aliases'});
    this.ipv6arrayControl = _.find(this.fieldConfig, {'name' : 'ipv6_aliases'});
    this.vlan_pint = _.find(this.fieldConfig, {'name' : 'vlan_parent_interface'});
    this.bridge_members = _.find(this.fieldConfig, {'name' : 'bridge_members'});
    this.lag_ports = _.find(this.fieldConfig, {'name' : 'lag_ports'});
    this.route.params.subscribe(params => {
      if(!params['pk']) {
        this.type.type = 'select';
      } else {
        this.confirmSubmit = true;
        this.ipv4arrayControl.initialCount = this.initialCount['ipv4_aliases']
          = this.initialCount_default['ipv4_aliases'] = 0;
        this.ipv6arrayControl.initialCount = this.initialCount['ipv6_aliases']
          = this.initialCount_default['ipv6_aliases'] = 0;
      }
    });
  }

  afterInit(entityForm: any) {
    /*this.int_interface_fg = entityForm.formGroup.controls['int_interface'];

    if (entityForm.isNew) {
      this.ws.call(this.queryCall, []).subscribe((res) => {
        if (res.data.length === 0) {
          this.ws.call('interfaces.websocket_interface', []).subscribe((wsint) => {
            if (wsint && wsint.name) {
              this.wsint = wsint.name;
              this.translate.get(this.int_warning).subscribe((int_warning) => {
                this.translate.get(this.int_warning_2).subscribe((int_warning_2) => {
                  this.int_interface_warning = int_warning + wsint.name + int_warning_2;
                });
              });
              this.int_interface_fg_sub = this.int_interface_fg.valueChanges.subscribe((val) => {
                if (val !== this.wsint) {
                  this.int_interface.warnings = this.int_interface_warning;
                } else {
                  this.int_interface.warnings = null;
                }
              });
              this.int_interface_fg.setValue(wsint.name);
              entityForm.formGroup.controls['int_name'].setValue(wsint.name);
            }
          }, (err) => {
            new EntityUtils().handleWSError(entityForm, err);
          });
        }
      });
    }*/
    if (entityForm.isNew) {
      this.type_fg = entityForm.formGroup.controls['type'];
      this.type_subscription = this.type_fg.valueChanges.subscribe((type) => {
        this.setType(type);
      });
      this.networkService.getVlanParentInterfaceChoices().subscribe((res) => {
        for (const key in res) {
          this.vlan_pint.options.push({label: key, value: res[key]});
        }
      });
      this.networkService.getLaggPortsChoices().subscribe((res) => {
        for (const key in res) {
          this.lag_ports.options.push({label: key, value: res[key]});
        }
      });
      this.networkService.getBridgeMembersChoices().subscribe((res) => {
        for (const key in res) {
          this.bridge_members.options.push({label: key, value: res[key]});
        }
      });
    } else {
      entityForm.setDisabled('name', true);
      entityForm.setDisabled('type', true);
    }
    this.ws.call('notifier.choices', ['VLAN_PCP_CHOICES']).subscribe((res) => {
      this.vlan_pcp = _.find(this.fieldConfig, {'name' : 'vlan_pcp'});
      res.forEach((item) => {
        this.vlan_pcp.options.push({label : item[1], value : item[0]});
      });
    });
    this.ipv4formArray = entityForm.formGroup.controls['ipv4_aliases'];
    this.ipv6formArray = entityForm.formGroup.controls['ipv6_aliases'];
  }

  clean(data) {
    let aliases = []
    for (let i = 0; i < data.ipv4_aliases.length; i++) {
      if (!data.ipv4_aliases[i]['delete'] &&
          !!data.ipv4_aliases[i]['address']) {
        let strings = data.ipv4_aliases[i]['address'].split('/');
        aliases.push({address:strings[0],
                      netmask:parseInt(strings[1],10)});
      }
    }
    for (let i = 0; i < data.ipv6_aliases.length; i++) {
      if (!data.ipv6_aliases[i]['delete'] &&
          !!data.ipv6_aliases[i]['address'] &&
          !!data.ipv6_aliases[i]['netmask']) {
        aliases.push({address:data.ipv6_aliases[i]['address'],
                      netmask:parseInt(data.ipv6_aliases[i]['netmaskbit'],10)});
      }
    }
    delete data.ipv4_aliases;
    delete data.ipv6_aliases;
    data.aliases = aliases;
    return data;
  }

  preHandler(data: any[]): any[] {
    let aliases = [];
    for (let i = 0; i < data.length; i++) {
      let alias = data[i];
      if (alias.netmask) {
        aliases.push({address:alias.address});
      }
    }
    return aliases;
  }

  resourceTransformIncomingRestData(data) {
    const ipv4_aliases = [];
    const ipv6_aliases = [];
    const aliases = data['aliases'];
    for (let i = 0; i < aliases.length; i++) {
      aliases[i].address = aliases[i].address + '/' + aliases[i].netmask;
      console.log(aliases[i]);
      if (aliases[i].type === "INET") {
        ipv4_aliases.push(aliases[i]);
      } else {
        ipv6_aliases.push(aliases[i]);
      }
    }
    data['ipv4_aliases'] = ipv4_aliases;
    data['ipv6_aliases'] = ipv6_aliases;

    const type = data['type'];
    const id = data['id'];
    this.setType(type);
    if (type === "LINK_AGGREGATION") {
      this.networkService.getLaggPortsChoices(id).subscribe((res) => {
        for (const key in res) {
          this.lag_ports.options.push({label: key, value: res[key]});
        }
      });
    } else if (type === "BRIDGE") {
      this.networkService.getBridgeMembersChoices(id).subscribe((res) => {
        for (const key in res) {
          this.bridge_members.options.push({label: key, value: res[key]});
        }
      });
    } else if (type === "VLAN") {
      this.entityForm.setDisabled('vlan_parent_interface', true);
    }

    return data;
  }

  ngOnDestroy() {
    if (this.type_subscription) {
      this.type_subscription.unsubscribe();
    }
  }
}
