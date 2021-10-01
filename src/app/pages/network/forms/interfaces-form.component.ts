import { Component, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as ipRegex from 'ip-regex';
import isCidr from 'is-cidr';
import * as _ from 'lodash';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import {
  LACPDURate, LinkAggregationProtocol, NetworkInterfaceAliasType, NetworkInterfaceType, XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/network/interfaces/interfaces-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormListConfig, FormSelectConfig, FormInputConfig,
} from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ipv4or6cidrValidator, ipv4or6Validator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { NetworkService, DialogService, WebSocketService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-interfaces-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class InterfacesFormComponent extends ViewControllerComponent implements FormConfiguration, OnDestroy {
  queryCall: 'interface.query' = 'interface.query';
  addCall: 'interface.create' = 'interface.create';
  editCall: 'interface.update' = 'interface.update';
  queryKey = 'id';
  isEntity = true;
  protected is_ha = false;
  private aliases_fc: FieldConfig;
  protected ipPlaceholder: string;
  protected failoverPlaceholder: string;
  saveSubmitText = helptext.int_save_button;
  protected offload_warned = false;
  protected isOneColumnForm = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.interface_settings,
      label: true,
      class: 'interface_settings',
      config: [
        {
          type: 'select',
          name: 'type',
          placeholder: helptext.int_type_placeholder,
          tooltip: helptext.int_type_tooltip,
          required: true,
          options: helptext.int_type_options,
        },
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.int_name_placeholder,
          tooltip: helptext.int_name_tooltip,
          validation: helptext.int_name_validation,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.int_description_placeholder,
          tooltip: helptext.int_description_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ipv4_dhcp',
          placeholder: helptext.int_dhcp_placeholder,
          tooltip: helptext.int_dhcp_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ipv6_auto',
          placeholder: helptext.int_ipv6auto_placeholder,
          tooltip: helptext.int_ipv6auto_tooltip,
        },
      ],
      colspan: 2,
    },
    {
      name: helptext.bridge_settings,
      label: false,
      class: 'bridge_settings',
      config: [
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
      ],
      colspan: 2,
    },
    {
      name: helptext.lag_settings,
      label: false,
      class: 'lag_settings',
      config: [
        {
          type: 'select',
          name: 'lag_protocol',
          placeholder: helptext.lagg_protocol_placeholder,
          tooltip: helptext.lagg_protocol_tooltip,
          options: [],
          required: true,
          isHidden: true,
          disabled: true,
          validation: helptext.lagg_protocol_validation,
          value: 'NONE',
        },
        {
          type: 'select',
          name: 'xmit_hash_policy',
          placeholder: helptext.xmit_hash_policy_placeholder,
          options: [],
          required: true,
          isHidden: true,
          disabled: true,
        },
        {
          type: 'select',
          name: 'lacpdu_rate',
          placeholder: helptext.lacpdu_rate_placeholder,
          options: [],
          required: true,
          isHidden: true,
          disabled: true,
        },
        {
          type: 'select',
          name: 'lag_ports',
          placeholder: helptext.lagg_interfaces_placeholder,
          tooltip: helptext.lagg_interfaces_tooltip,
          options: [],
          multiple: true,
          required: true,
          isHidden: true,
          disabled: true,
          validation: helptext.lagg_interfaces_validation,
        },
      ],
      colspan: 2,
    },
    {
      name: helptext.vlan_settings,
      label: false,
      class: 'vlan_settings',
      config: [
        {
          type: 'select',
          name: 'vlan_parent_interface',
          placeholder: helptext.vlan_pint_placeholder,
          tooltip: helptext.vlan_pint_tooltip,
          options: [],
          required: true,
          isHidden: true,
          disabled: true,
          validation: helptext.vlan_pint_validation,
        },
        {
          type: 'input',
          name: 'vlan_tag',
          placeholder: helptext.vlan_tag_placeholder,
          tooltip: helptext.vlan_tag_tooltip,
          required: true,
          isHidden: true,
          disabled: true,
          validation: helptext.vlan_tag_validation,
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
      ],
      colspan: 2,
    },
    {
      name: helptext.failover_settings,
      label: false,
      class: 'failover_settings',
      config: [
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
          options: [{ label: '---', value: null }],
        },
        {
          type: 'select',
          name: 'failover_vhid',
          placeholder: helptext.failover_vhid_placeholder,
          tooltip: helptext.failover_vhid_tooltip,
          isHidden: true,
          disabled: true,
          options: [{ label: '---', value: null }],
        },
      ],
      colspan: 2,
    },
    {
      name: helptext.other_settings,
      label: true,
      class: 'other_settings',
      config: [
        {
          type: 'checkbox',
          name: 'disable_offload_capabilities',
          placeholder: helptext.disable_offload_capabilities_placeholder,
          tooltip: helptext.disable_offload_capabilities_tooltip,
        },
        {
          type: 'input',
          name: 'mtu',
          placeholder: helptext.mtu_placeholder,
          tooltip: helptext.mtu_tooltip,
          validation: helptext.mtu_validation,
          value: 1500,
        },
      ],
      colspan: 2,
    },
    {
      name: helptext.ip_addresses,
      label: true,
      class: 'ip_addresses',
      config: [
        {
          type: 'list',
          name: 'aliases',
          width: '100%',
          placeholder: helptext.alias_list_placeholder,
          label: helptext.alias_list_label,
          templateListField: [
            {
              name: 'address',
              placeholder: helptext.alias_address_placeholder,
              tooltip: helptext.alias_address_tooltip,
              type: 'ipwithnetmask',
              validation: [ipv4or6cidrValidator()],
            },
            {
              name: 'failover_address',
              placeholder: helptext.failover_alias_address_placeholder,
              tooltip: helptext.failover_alias_address_tooltip,
              disabled: true,
              isHidden: true,
              type: 'input',
              validation: [ipv4or6Validator()],
            },
            {
              name: 'failover_virtual_address',
              placeholder: helptext.failover_virtual_alias_address_placeholder,
              tooltip: helptext.failover_virtual_alias_address_tooltip,
              disabled: true,
              isHidden: true,
              type: 'input',
              validation: [ipv4or6Validator()],

            },
          ],
          listFields: [],
        },
      ],
      colspan: 2,
    },
    {
      name: 'divider',
      divider: true,
    },
  ];

  private vlan_fields = ['vlan_tag', 'vlan_pcp', 'vlan_parent_interface'];
  private lagg_fields = ['lag_protocol', 'lag_ports'];
  private bridge_fields = ['bridge_members'];
  private failover_fields = ['failover_critical', 'failover_group', 'failover_vhid'];
  private vlan_fieldset: FieldSet;
  private lag_fieldset: FieldSet;
  private bridge_fieldset: FieldSet;
  private failover_fieldset: FieldSet;
  private vlan_pint: FormSelectConfig | FormInputConfig;
  private lag_ports: FormSelectConfig;
  private lag_protocol: FormSelectConfig;
  private bridge_members: FormSelectConfig;
  private type: FieldConfig;
  private type_fg: FormControl;
  private entityForm: EntityFormComponent;

  protected ipListControl: FormListConfig;
  protected failover_group: FormSelectConfig;
  protected failover_vhid: FormSelectConfig;

  save_button_enabled: boolean;

  confirmSubmit = false;
  confirmSubmitDialog = {
    title: T('Save Network Interface Changes'),
    message: T('Network connectivity will be interrupted. Proceed?'),
    hideCheckbox: false,
  };

  title: string;
  afterModalFormClosed: () => void;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected networkService: NetworkService, protected dialog: DialogService,
    protected ws: WebSocketService) {
    super();
  }

  setType(type: NetworkInterfaceType): void {
    const is_vlan = (type === NetworkInterfaceType.Vlan);
    const is_bridge = (type === NetworkInterfaceType.Bridge);
    const is_lagg = (type === NetworkInterfaceType.LinkAggregation);
    this.vlan_fields.forEach((field) => {
      this.entityForm.setDisabled(field, !is_vlan, !is_vlan);
    });
    this.lagg_fields.forEach((field) => {
      this.entityForm.setDisabled(field, !is_lagg, !is_lagg);
    });
    const lagProtocol = this.entityForm.formGroup.get('lag_protocol')?.value;
    if (lagProtocol) {
      if (lagProtocol === LinkAggregationProtocol.Lacp) {
        this.entityForm.setDisabled('xmit_hash_policy', !is_lagg, !is_lagg);
        this.entityForm.setDisabled('lacpdu_rate', !is_lagg, !is_lagg);
      } else if (lagProtocol === LinkAggregationProtocol.LoadBalance) {
        this.entityForm.setDisabled('xmit_hash_policy', !is_lagg, !is_lagg);
        this.entityForm.setDisabled('lacpdu_rate', true, true);
      } else {
        this.entityForm.setDisabled('lacpdu_rate', true, true);
        this.entityForm.setDisabled('xmit_hash_policy', true, true);
      }
    } else {
      this.entityForm.setDisabled('lacpdu_rate', true, true);
      this.entityForm.setDisabled('xmit_hash_policy', true, true);
    }

    this.bridge_fields.forEach((field) => {
      this.entityForm.setDisabled(field, !is_bridge, !is_bridge);
    });
    this.vlan_fieldset.label = is_vlan;
    this.lag_fieldset.label = is_lagg;
    this.bridge_fieldset.label = is_bridge;
  }

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.vlan_fieldset = _.find(this.fieldSets, { class: 'vlan_settings' });
    this.lag_fieldset = _.find(this.fieldSets, { class: 'lag_settings' });
    this.bridge_fieldset = _.find(this.fieldSets, { class: 'bridge_settings' });
    this.failover_fieldset = _.find(this.fieldSets, { class: 'failover_settings' });
    this.vlan_pint = _.find(this.vlan_fieldset.config, { name: 'vlan_parent_interface' }) as FormSelectConfig;
    this.ws.call('interface.xmit_hash_policy_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const xmitHashPolicyFieldConfig = _.find(this.fieldConfig, { name: 'xmit_hash_policy' }) as FormSelectConfig;
      xmitHashPolicyFieldConfig.options = [];
      for (const key in choices) {
        xmitHashPolicyFieldConfig.options.push({ label: key, value: key });
      }
      this.entityForm.formGroup.get('xmit_hash_policy').setValue(XmitHashPolicy.Layer2Plus3);
    });

    this.ws.call('interface.lacpdu_rate_choices').pipe(untilDestroyed(this)).subscribe((choices) => {
      const lacpduRateFieldConfig = _.find(this.fieldConfig, { name: 'lacpdu_rate' }) as FormSelectConfig;
      lacpduRateFieldConfig.options = [];
      for (const key in choices) {
        lacpduRateFieldConfig.options.push({ label: key, value: key });
      }
      this.entityForm.formGroup.get('lacpdu_rate').setValue(LACPDURate.Slow);
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    if (entityForm.pk !== undefined) {
      this.vlan_pint = _.find(this.fieldConfig, { name: 'vlan_parent_interface' }) as FormInputConfig;
      this.vlan_pint.type = 'input';
      this.vlan_pint.readonly = true;
      this.vlan_pint.disabled = true;
      this.vlan_pint.required = false;
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
      this.vlan_pint = _.find(this.fieldConfig, { name: 'vlan_parent_interface' }) as FormSelectConfig;
    }

    this.bridge_members = _.find(this.fieldConfig, { name: 'bridge_members' }) as FormSelectConfig;
    this.lag_ports = _.find(this.fieldConfig, { name: 'lag_ports' }) as FormSelectConfig;
    this.lag_protocol = _.find(this.fieldConfig, { name: 'lag_protocol' }) as FormSelectConfig;
    this.type = _.find(this.fieldConfig, { name: 'type' });
    this.ipListControl = _.find(this.fieldConfig, { name: 'aliases' }) as FormListConfig;
    this.failover_group = _.find(this.fieldConfig, { name: 'failover_group' }) as FormSelectConfig;
    this.failover_vhid = _.find(this.fieldConfig, { name: 'failover_vhid' }) as FormSelectConfig;
    for (let i = 1; i <= 32; i++) {
      this.failover_group.options.push({ label: String(i), value: i });
    }

    for (let i = 1; i <= 255; i++) {
      this.failover_vhid.options.push({ label: String(i), value: i });
    }

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.node').pipe(untilDestroyed(this)).subscribe((node) => {
        if (node === 'A') {
          this.ipPlaceholder = ` (${globalHelptext.thisCtlr})`;
          this.failoverPlaceholder = ` (${globalHelptext.Ctrlr} 2)`;
        } else if (node === 'B') {
          this.ipPlaceholder = ` (${globalHelptext.Ctrlr} 1)`;
          this.failoverPlaceholder = ` (${globalHelptext.thisCtlr})`;
        } else {
          return;
        }
        _.find(this.ipListControl.templateListField, { name: 'address' }).placeholder += this.ipPlaceholder;
        _.find(this.ipListControl.templateListField, { name: 'failover_address' }).placeholder += this.failoverPlaceholder;
      });
    }

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)
      && window.localStorage.getItem('alias_ips') === 'show') {
      const failover_virtual_address = _.find(this.ipListControl.templateListField, { name: 'failover_virtual_address' });
      const failover_address = _.find(this.ipListControl.templateListField, { name: 'failover_address' });
      failover_virtual_address['disabled'] = false;
      failover_virtual_address['isHidden'] = false;
      failover_address['disabled'] = false;
      failover_address['isHidden'] = false;
    }
    this.aliases_fc = _.find(this.fieldConfig, { name: 'aliases' });

    entityForm.formGroup.controls['disable_offload_capabilities'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: boolean) => {
      if (res && !this.offload_warned) {
        this.dialog.confirm({
          title: helptext.disable_offload_capabilities_warning_title,
          message: helptext.disable_offload_capabilities_warning_msg,
        }).pipe(untilDestroyed(this)).subscribe((confirm: boolean) => {
          if (confirm) {
            this.offload_warned = true;
          } else {
            entityForm.formGroup.controls['disable_offload_capabilities'].setValue(false);
          }
        });
      }
    });

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((is_ha) => {
        this.failover_fieldset.label = is_ha;
        if (window.localStorage.getItem('product_type').includes(ProductType.Scale)) {
          _.remove(this.failover_fields, (el) => el === 'failover_vhid');
        }
        this.failover_fields.forEach((field) => {
          entityForm.setDisabled(field, !is_ha, !is_ha);
        });
        if (is_ha) {
          this.entityForm.formGroup.controls['aliases'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any[]) => {
            let v6_found = false;
            let mismatch_found = false;
            res.forEach((alias) => {
              const address = alias['address'];
              const failover_address = alias['failover_address'];
              const virtual_address = alias['failover_virtual_address'];
              if (
                !(address && failover_address && virtual_address)
                && !(!address && !failover_address && !virtual_address)
              ) {
                mismatch_found = true;
              }
              if (isCidr.v6(address)
                  || isCidr.v6(failover_address)
                  || isCidr.v6(virtual_address)) {
                v6_found = true;
              }
            });
            if (v6_found) {
              this.aliases_fc.hasErrors = true;
              this.aliases_fc.errors = helptext.failover_alias_v6_error;
              this.save_button_enabled = false;
            } else if (mismatch_found) {
              this.aliases_fc.hasErrors = true;
              this.aliases_fc.errors = helptext.failover_alias_set_error;
              this.save_button_enabled = false;
            } else {
              this.aliases_fc.hasErrors = false;
              this.aliases_fc.errors = '';
              this.save_button_enabled = true;
            }
          });
        }
      });
    }
    if (entityForm.isNew) {
      this.type_fg = entityForm.formGroup.controls['type'] as FormControl;
      this.type_fg.valueChanges.pipe(untilDestroyed(this)).subscribe((type: NetworkInterfaceType) => {
        this.setType(type);
      });

      if (this.vlan_pint.type === 'select') {
        this.networkService.getVlanParentInterfaceChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
          const vlan_pint = this.vlan_pint as FormSelectConfig;
          for (const key in choices) {
            vlan_pint.options.push({ label: choices[key], value: key });
          }
        });
      }

      this.networkService.getLaggPortsChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.lag_ports.options.push({ label: choices[key], value: key });
        }
      });
      this.networkService.getLaggProtocolChoices().pipe(untilDestroyed(this)).subscribe((res) => {
        res.forEach((protocol) => {
          this.lag_protocol.options.push({ label: protocol, value: protocol });
        });
      });
      this.networkService.getBridgeMembersChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.bridge_members.options.push({ label: choices[key], value: key });
        }
      });
    } else {
      entityForm.setDisabled('name', true);
      entityForm.setDisabled('type', true, true);
    }

    this.entityForm.formGroup.get('lag_protocol').valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      if (value === LinkAggregationProtocol.Lacp) {
        this.entityForm.setDisabled('xmit_hash_policy', false, false);
        this.entityForm.setDisabled('lacpdu_rate', false, false);
      } else if (value === LinkAggregationProtocol.LoadBalance) {
        this.entityForm.setDisabled('xmit_hash_policy', false, false);
        this.entityForm.setDisabled('lacpdu_rate', true, true);
      } else {
        this.entityForm.setDisabled('lacpdu_rate', true, true);
        this.entityForm.setDisabled('xmit_hash_policy', true, true);
      }
    });
  }

  clean(data: any): any {
    if (data['mtu'] === '') {
      data['mtu'] = 1500;
    }
    const aliases: NetworkInterfaceAlias[] = [];
    const failover_aliases: { address: string }[] = [];
    const failover_virtual_aliases: { address: string }[] = [];
    data.aliases.forEach((alias: any) => {
      if (!alias['delete']
        && !!alias['address']) {
        const strings = alias['address'].split('/');
        if (strings[0]) {
          aliases.push({
            address: strings[0],
            type: ipRegex.v6().test(strings[0]) ? NetworkInterfaceAliasType.Inet6 : NetworkInterfaceAliasType.Inet,
            netmask: parseInt(strings[1], 10),
          });
        }
        if (alias['failover_address']) {
          const f_strings = alias['failover_address'].split('/');
          if (f_strings[0]) {
            failover_aliases.push({ address: f_strings[0] });
          }
        }
        if (alias['failover_virtual_address']) {
          const fv_strings = alias['failover_virtual_address'].split('/');
          if (fv_strings[0]) {
            failover_virtual_aliases.push({ address: fv_strings[0] });
          }
        }
      }
    });

    data.aliases = aliases;
    if (data.type === NetworkInterfaceType.Bridge && data.bridge_members === undefined) {
      data.bridge_members = [];
    }
    if (failover_aliases.length > 0) {
      data.failover_aliases = failover_aliases;
    }
    if (failover_virtual_aliases.length > 0) {
      data.failover_virtual_aliases = failover_virtual_aliases;
    }
    return data;
  }

  resourceTransformIncomingRestData(data: NetworkInterface): any {
    const aliases = data.aliases;
    const transformedAliases: any[] = [];
    const failover_aliases = data.failover_aliases;
    const failover_virtual_aliases = data.failover_virtual_aliases;
    for (let i = 0; i < aliases.length; i++) {
      transformedAliases[i] = {};
      transformedAliases[i].address = aliases[i].address + '/' + aliases[i].netmask;
      if (failover_aliases && failover_aliases[i]) {
        transformedAliases[i].failover_address = failover_aliases[i].address;
      }
      if (failover_virtual_aliases && failover_virtual_aliases[i]) {
        transformedAliases[i].failover_virtual_address = failover_virtual_aliases[i].address;
      }
    }

    const type = data.type;
    const id = data.id;
    this.setType(type);
    if (type === NetworkInterfaceType.LinkAggregation) {
      this.networkService.getLaggPortsChoices(id).pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.lag_ports.options.push({ label: choices[key], value: key });
        }
      });

      this.networkService.getLaggProtocolChoices().pipe(untilDestroyed(this)).subscribe((res) => {
        res.forEach((protocol) => {
          this.lag_protocol.options.push({ label: protocol, value: protocol });
        });
      });
    } else if (type === NetworkInterfaceType.Bridge) {
      this.networkService.getBridgeMembersChoices(id).pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.bridge_members.options.push({ label: choices[key], value: key });
        }
      });
    } else if (type === NetworkInterfaceType.Vlan) {
      this.entityForm.setDisabled('vlan_parent_interface', true);
    }

    return {
      ...data,
      aliases: transformedAliases,
    };
  }

  afterSave(): void {
    this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
  }
}
