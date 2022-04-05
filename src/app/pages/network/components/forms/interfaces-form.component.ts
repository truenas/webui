import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as ipRegex from 'ip-regex';
import * as _ from 'lodash';
import {
  LacpduRate, LinkAggregationProtocol, NetworkInterfaceAliasType, NetworkInterfaceType, XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-form';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { NetworkInterface, NetworkInterfaceAlias } from 'app/interfaces/network-interface.interface';
import { Option } from 'app/interfaces/option.interface';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import {
  FieldConfig, FormListConfig, FormSelectConfig, FormInputConfig, FormChipConfig,
} from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { ipv4or6cidrValidator, ipv4or6Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { NetworkService, DialogService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';

@UntilDestroy()
@Component({
  selector: 'app-interfaces-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class InterfacesFormComponent implements FormConfiguration {
  queryCall = 'interface.query' as const;
  addCall = 'interface.create' as const;
  editCall = 'interface.update' as const;
  queryKey = 'id';
  isEntity = true;
  private aliasesField: FieldConfig;
  protected ipPlaceholder: string;
  protected failoverPlaceholder: string;
  saveSubmitText = helptext.int_save_button;
  protected isOneColumnForm = true;
  private lagPortsOption: Option[] = [];

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
          value: LinkAggregationProtocol.None,
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
          type: 'chip',
          name: 'lag_ports',
          placeholder: helptext.lagg_interfaces_placeholder,
          tooltip: helptext.lagg_interfaces_tooltip,
          required: true,
          isHidden: true,
          disabled: true,
          validation: helptext.lagg_interfaces_validation,
          autocomplete: true,
          selectOnly: true,
          searchOptions: [],
          parent: this,
          updater: (value: string, values?: string[]) => this.updateSearchOptions(value, values),
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

  private vlanFields = ['vlan_tag', 'vlan_pcp', 'vlan_parent_interface'];
  private laggFields = ['lag_protocol', 'lag_ports'];
  private bridgeFields = ['bridge_members'];
  private failoverFields = ['failover_critical', 'failover_group', 'failover_vhid'];
  private vlanFieldset: FieldSet;
  private lagFieldset: FieldSet;
  private bridgeFieldset: FieldSet;
  private failoverFieldset: FieldSet;
  private vlanParentInterfaceField: FormSelectConfig | FormInputConfig;
  private lagPortsField: FormChipConfig;
  private lagProtocolField: FormSelectConfig;
  private bridgeMembersField: FormSelectConfig;
  private type: FieldConfig;
  private typeControl: FormControl;
  private entityForm: EntityFormComponent;

  protected ipListControl: FormListConfig;
  protected failoverGroupField: FormSelectConfig;
  protected failoverVhidField: FormSelectConfig;

  saveButtonEnabled: boolean;

  confirmSubmit = false;
  confirmSubmitDialog = {
    title: this.translate.instant('Save Network Interface Changes'),
    message: this.translate.instant('Network connectivity will be interrupted. Proceed?'),
    hideCheckbox: false,
  };

  title: string;
  afterModalFormClosed: () => void;

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected networkService: NetworkService,
    protected dialog: DialogService,
    protected ws: WebSocketService,
    protected translate: TranslateService,
    private core: CoreService,
  ) {}

  setType(type: NetworkInterfaceType): void {
    const isVlan = (type === NetworkInterfaceType.Vlan);
    const isBridge = (type === NetworkInterfaceType.Bridge);
    const isLagg = (type === NetworkInterfaceType.LinkAggregation);
    this.vlanFields.forEach((field) => {
      this.entityForm.setDisabled(field, !isVlan, !isVlan);
    });
    this.laggFields.forEach((field) => {
      this.entityForm.setDisabled(field, !isLagg, !isLagg);
    });
    const lagProtocol = this.entityForm.formGroup.get('lag_protocol')?.value;
    this.lagPortsField.tooltip = helptext.lagg_interfaces_tooltip;
    if (lagProtocol) {
      if (lagProtocol === LinkAggregationProtocol.Lacp) {
        this.entityForm.setDisabled('xmit_hash_policy', !isLagg, !isLagg);
        this.entityForm.setDisabled('lacpdu_rate', !isLagg, !isLagg);
      } else if (lagProtocol === LinkAggregationProtocol.LoadBalance) {
        this.entityForm.setDisabled('xmit_hash_policy', !isLagg, !isLagg);
        this.entityForm.setDisabled('lacpdu_rate', true, true);
      } else {
        this.entityForm.setDisabled('lacpdu_rate', true, true);
        this.entityForm.setDisabled('xmit_hash_policy', true, true);
      }
      if (lagProtocol === LinkAggregationProtocol.Failover) {
        this.lagPortsField.tooltip = helptext.lagg_interfaces_tooltip + ' ' + helptext.lagg_interfaces_failover_tooltip;
      }
    } else {
      this.entityForm.setDisabled('lacpdu_rate', true, true);
      this.entityForm.setDisabled('xmit_hash_policy', true, true);
    }

    this.bridgeFields.forEach((field) => {
      this.entityForm.setDisabled(field, !isBridge, !isBridge);
    });
    this.vlanFieldset.label = isVlan;
    this.lagFieldset.label = isLagg;
    this.bridgeFieldset.label = isBridge;
  }

  preInit(entityForm: EntityFormComponent): void {
    this.entityForm = entityForm;
    this.vlanFieldset = _.find(this.fieldSets, { class: 'vlan_settings' });
    this.lagFieldset = _.find(this.fieldSets, { class: 'lag_settings' });
    this.bridgeFieldset = _.find(this.fieldSets, { class: 'bridge_settings' });
    this.failoverFieldset = _.find(this.fieldSets, { class: 'failover_settings' });
    this.vlanParentInterfaceField = _.find(this.vlanFieldset.config, { name: 'vlan_parent_interface' }) as FormSelectConfig;
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
      this.entityForm.formGroup.get('lacpdu_rate').setValue(LacpduRate.Slow);
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    if (entityForm.pk !== undefined) {
      this.vlanParentInterfaceField = _.find(this.fieldConfig, { name: 'vlan_parent_interface' }) as FormInputConfig;
      this.vlanParentInterfaceField.type = 'input';
      this.vlanParentInterfaceField.readonly = true;
      this.vlanParentInterfaceField.disabled = true;
      this.vlanParentInterfaceField.required = false;
      this.title = helptext.title_edit;
    } else {
      this.title = helptext.title_add;
      this.vlanParentInterfaceField = _.find(this.fieldConfig, { name: 'vlan_parent_interface' }) as FormSelectConfig;
    }

    this.bridgeMembersField = _.find(this.fieldConfig, { name: 'bridge_members' }) as FormSelectConfig;
    this.lagPortsField = _.find(this.fieldConfig, { name: 'lag_ports' }) as FormChipConfig;
    this.lagProtocolField = _.find(this.fieldConfig, { name: 'lag_protocol' }) as FormSelectConfig;
    this.type = _.find(this.fieldConfig, { name: 'type' });
    this.ipListControl = _.find(this.fieldConfig, { name: 'aliases' }) as FormListConfig;
    this.failoverGroupField = _.find(this.fieldConfig, { name: 'failover_group' }) as FormSelectConfig;
    this.failoverVhidField = _.find(this.fieldConfig, { name: 'failover_vhid' }) as FormSelectConfig;
    for (let i = 1; i <= 32; i++) {
      this.failoverGroupField.options.push({ label: String(i), value: i });
    }

    for (let i = 1; i <= 255; i++) {
      this.failoverVhidField.options.push({ label: String(i), value: i });
    }

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.node').pipe(untilDestroyed(this)).subscribe((node) => {
        if (node === 'A') {
          this.ipPlaceholder = ' (This Controller)';
          this.failoverPlaceholder = ' (TrueNAS Controller 2)';
        } else if (node === 'B') {
          this.ipPlaceholder = ' (TrueNAS Controller 1)';
          this.failoverPlaceholder = ' (This Controller)';
        } else {
          return;
        }
        _.find(this.ipListControl.templateListField, { name: 'address' }).placeholder += this.ipPlaceholder;
        _.find(this.ipListControl.templateListField, { name: 'failover_address' }).placeholder += this.failoverPlaceholder;
      });
    }

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)
      && window.localStorage.getItem('alias_ips') === 'show') {
      const failoverVirtualAddress = _.find(this.ipListControl.templateListField, { name: 'failover_virtual_address' });
      const failoverAddress = _.find(this.ipListControl.templateListField, { name: 'failover_address' });
      failoverVirtualAddress['disabled'] = false;
      failoverVirtualAddress['isHidden'] = false;
      failoverAddress['disabled'] = false;
      failoverAddress['isHidden'] = false;
    }
    this.aliasesField = _.find(this.fieldConfig, { name: 'aliases' });

    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => {
        this.failoverFieldset.label = isHa;
        if (window.localStorage.getItem('product_type').includes(ProductType.Scale)) {
          _.remove(this.failoverFields, (el) => el === 'failover_vhid');
        }
        this.failoverFields.forEach((field) => {
          entityForm.setDisabled(field, !isHa, !isHa);
        });
        if (isHa) {
          this.entityForm.formGroup.controls['aliases'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any[]) => {
            let mismatchFound = false;
            res.forEach((alias) => {
              const address = alias['address'];
              const failoverAddress = alias['failover_address'];
              const virtualAddress = alias['failover_virtual_address'];
              if (
                !(address && failoverAddress && virtualAddress)
                && !(!address && !failoverAddress && !virtualAddress)
              ) {
                mismatchFound = true;
              }
            });
            if (mismatchFound) {
              this.aliasesField.hasErrors = true;
              this.aliasesField.errors = helptext.failover_alias_set_error;
              this.saveButtonEnabled = false;
            } else {
              this.aliasesField.hasErrors = false;
              this.aliasesField.errors = '';
              this.saveButtonEnabled = true;
            }
          });
        }
      });
    }
    if (entityForm.isNew) {
      this.typeControl = entityForm.formGroup.controls['type'] as FormControl;
      this.typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((type: NetworkInterfaceType) => {
        this.setType(type);
      });

      if (this.vlanParentInterfaceField.type === 'select') {
        this.networkService.getVlanParentInterfaceChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
          const vlanPint = this.vlanParentInterfaceField as FormSelectConfig;
          for (const key in choices) {
            vlanPint.options.push({ label: choices[key], value: key });
          }
        });
      }

      this.networkService.getLaggPortsChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.lagPortsOption.push({ label: choices[key], value: key });
        }
        this.lagPortsField.searchOptions = this.lagPortsOption;
      });
      this.networkService.getLaggProtocolChoices().pipe(untilDestroyed(this)).subscribe((res) => {
        res.forEach((protocol) => {
          this.lagProtocolField.options.push({ label: protocol, value: protocol });
        });
      });
      this.networkService.getBridgeMembersChoices().pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.bridgeMembersField.options.push({ label: choices[key], value: key });
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
      if (value === LinkAggregationProtocol.Failover) {
        this.lagPortsField.tooltip = helptext.lagg_interfaces_failover_tooltip;
      } else {
        this.lagPortsField.tooltip = helptext.lagg_interfaces_tooltip;
      }
    });
  }

  updateSearchOptions(value = '', values?: string[]): void {
    this.lagPortsField.searchOptions = this.lagPortsOption.filter((option) => {
      /** Not display the options already selected (for selectOnly) */
      if (values && values.includes(option.value as string)) {
        return false;
      }
      /** Not display the options no match with the search */
      if (value && !(option.value as string).toLowerCase().includes(value.toLowerCase())) {
        return false;
      }
      return true;
    });
  }

  clean(data: any): any {
    if (data['mtu'] === '') {
      data['mtu'] = 1500;
    }
    const aliases: NetworkInterfaceAlias[] = [];
    const failoverAliases: { address: string }[] = [];
    const failoverVirtualAliases: { address: string }[] = [];
    data.aliases.forEach((alias: any) => {
      if (!alias['delete'] && !!alias['address']) {
        const strings = alias['address'].split('/');
        if (strings[0]) {
          aliases.push({
            address: strings[0],
            type: ipRegex.v6().test(strings[0]) ? NetworkInterfaceAliasType.Inet6 : NetworkInterfaceAliasType.Inet,
            netmask: parseInt(strings[1], 10),
          });
        }
        if (alias['failover_address']) {
          const addressStrings = alias['failover_address'].split('/');
          if (addressStrings[0]) {
            failoverAliases.push({ address: addressStrings[0] });
          }
        }
        if (alias['failover_virtual_address']) {
          const virtualAddressStrings = alias['failover_virtual_address'].split('/');
          if (virtualAddressStrings[0]) {
            failoverVirtualAliases.push({ address: virtualAddressStrings[0] });
          }
        }
      }
    });

    data.aliases = aliases;
    if (data.type === NetworkInterfaceType.Bridge && data.bridge_members === undefined) {
      data.bridge_members = [];
    }
    if (failoverAliases.length > 0) {
      data.failover_aliases = failoverAliases;
    }
    if (failoverVirtualAliases.length > 0) {
      data.failover_virtual_aliases = failoverVirtualAliases;
    }
    return data;
  }

  resourceTransformIncomingRestData(data: NetworkInterface): any {
    const aliases = data.aliases;
    const transformedAliases: any[] = [];
    const failoverAliases = data.failover_aliases;
    const failoverVirtualAliases = data.failover_virtual_aliases;
    for (let i = 0; i < aliases.length; i++) {
      transformedAliases[i] = {};
      transformedAliases[i].address = aliases[i].address + '/' + aliases[i].netmask;
      if (failoverAliases && failoverAliases[i]) {
        transformedAliases[i].failover_address = failoverAliases[i].address;
      }
      if (failoverVirtualAliases && failoverVirtualAliases[i]) {
        transformedAliases[i].failover_virtual_address = failoverVirtualAliases[i].address;
      }
    }

    const type = data.type;
    const id = data.id;
    this.setType(type);
    if (type === NetworkInterfaceType.LinkAggregation) {
      this.networkService.getLaggPortsChoices(id).pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.lagPortsOption.push({ label: choices[key], value: key });
        }
      });

      this.networkService.getLaggProtocolChoices().pipe(untilDestroyed(this)).subscribe((res) => {
        res.forEach((protocol) => {
          this.lagProtocolField.options.push({ label: protocol, value: protocol });
        });
      });
    } else if (type === NetworkInterfaceType.Bridge) {
      this.networkService.getBridgeMembersChoices(id).pipe(untilDestroyed(this)).subscribe((choices) => {
        for (const key in choices) {
          this.bridgeMembersField.options.push({ label: choices[key], value: key });
        }
      });
    } else if (type === NetworkInterfaceType.Vlan) {
      this.entityForm.setDisabled('vlan_parent_interface', true);
    }

    return {
      ...data,
      aliases: transformedAliases,
      mtu: data.mtu || data.state?.mtu,
    };
  }

  afterSave(): void {
    this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
  }
}
