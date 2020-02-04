import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';

import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import * as _ from 'lodash';
import { JailService, WebSocketService, AppLoaderService, DialogService, NetworkService } from '../../../services/';
import { JailFormService } from './jail-form.service';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import { EntityUtils } from '../../common/entity/utils';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import { forbiddenValues } from '../../common/entity/entity-form/validators/forbidden-values-validation';
import helptext from '../../../helptext/jails/jail-configuration';
import { T } from '../../../translate-marker';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';

@Component({
  selector: 'app-jail-form',
  templateUrl: './jail-form.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss', '../jail-list/jail-list.component.css'],
  providers: [JailService, NetworkService, JailFormService, EntityFormService, FieldRelationService]
})
export class JailFormComponent implements OnInit, AfterViewInit {

  public isReady = false;
  protected queryCall = 'jail.query';
  protected updateCall = 'jail.update';
  protected upgradeCall = 'jail.upgrade';

  protected addCall = 'jail.create';
  public route_success: string[] = ['jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  protected pluginAddCall = 'plugin.create';
  public plugin_route_success: string[] = ['plugins'];

  public formGroup: any;
  public error: string;
  protected namesInUse = [];

  protected interfaces = this.jailFromService.interfaces;

  public fieldSets: FieldSet[] = [
    {
      name: helptext.fieldsets.basic,
      label: false,
      class: 'basic',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'plugin_name',
          placeholder: helptext.plugin_name_placeholder,
          disabled: true,
        },
        {
          type: 'input',
          name: 'uuid',
          placeholder: helptext.uuid_placeholder,
          tooltip: helptext.uuid_tooltip,
          required: true,
          validation: [regexValidator(this.jailService.jailNameRegex), forbiddenValues(this.namesInUse)],
        },
        {
          type: 'select',
          name: 'jailtype',
          placeholder: helptext.jailtype_placeholder,
          tooltip: helptext.jailtype_tooltip,
          options: [
            {
              label: 'Default (Clone Jail)',
              value: 'default',
            },
            {
              label: 'Basejail',
              value: 'basejail',
            }
          ],
          value: 'default',
        },
        {
          type: 'select',
          name: 'release',
          placeholder: helptext.release_placeholder,
          tooltip: helptext.release_tooltip,
          options: [],
          required: true,
          validation: [Validators.required],
        },
        {
          type: 'radio',
          name: 'https',
          placeholder: helptext.https_placeholder,
          options: [
            { label: 'HTTPS', value: true, tooltip: helptext.https_tooltip, },
            { label: 'HTTP', value: false, tooltip: helptext.http_tooltip, },
          ],
          value: true,
          isHidden: true,
        },
        {
          type: 'checkbox',
          name: 'dhcp',
          placeholder: helptext.dhcp_placeholder,
          tooltip: helptext.dhcp_tooltip,
          relation: [{
            action: "DISABLE",
            when: [{
              name: "nat",
              value: true
            }]
          }],
        },
        {
          type: 'checkbox',
          name: 'nat',
          placeholder: helptext.nat_placeholder,
          tooltip: helptext.nat_tooltip,
        },
        {
          type: 'checkbox',
          name: 'vnet',
          placeholder: helptext.vnet_placeholder,
          tooltip: helptext.vnet_tooltip,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'bpf',
          placeholder: helptext.bpf_placeholder,
          tooltip: helptext.bpf_tooltip,
          relation: [{
            action: "DISABLE",
            when: [{
              name: "nat",
              value: true
            }]
          }],
        },
        {
          type: 'list',
          name: 'ip4_addr',
          placeholder: 'IPv4 Addresses',
          relation: [{
            action: "ENABLE",
            connective: 'AND',
            when: [{
              name: "dhcp",
              value: false
            }, {
              name: 'nat',
              value: false,
            }]
          }],
          templateListField: [
            {
              type: 'select',
              name: 'ip4_interface',
              placeholder: helptext.ip4_interface_placeholder,
              tooltip: helptext.ip4_interface_tooltip,
              options: this.interfaces.vnetDisabled,
              value: '',
              class: 'inline',
              width: '30%',
            },
            {
              type: 'input',
              name: 'ip4_addr',
              placeholder: helptext.ip4_addr_placeholder,
              tooltip: helptext.ip4_addr_tooltip,
              validation: [regexValidator(this.networkService.ipv4_regex)],
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'ip4_netmask',
              placeholder: helptext.ip4_netmask_placeholder,
              tooltip: helptext.ip4_netmask_tooltip,
              options: this.networkService.getV4Netmasks(),
              value: '',
              class: 'inline',
              width: '20%',
            }
          ],
          listFields: []
        },
        {
          type: 'input',
          name: 'defaultrouter',
          placeholder: helptext.defaultrouter_placeholder,
          tooltip: helptext.defaultrouter_tooltip,
          relation: [{
            action: 'DISABLE',
            connective: 'OR',
            when: [{
              name: 'dhcp',
              value: true,
            }, {
              name: 'nat',
              value: true,
            }, {
              name: 'vnet',
              value: false,
            }]
          }]
        },
        {
          type: 'checkbox',
          name: 'auto_configure_ip6',
          placeholder: helptext.auto_configure_ip6_placeholder,
          tooltip: helptext.auto_configure_ip6_tooltip,
        },
        {
          type: 'list',
          name: 'ip6_addr',
          placeholder: 'IPv6 Addresses',
          relation: [{
            action: 'DISABLE',
            when: [{
              name: 'auto_configure_ip6',
              value: true,
            }]
          }],
          templateListField: [
            {
              type: 'select',
              name: 'ip6_interface',
              placeholder: helptext.ip6_interface_placeholder,
              tooltip: helptext.ip6_interface_tooltip,
              options: this.interfaces.vnetDisabled,
              value: '',
              class: 'inline',
              width: '30%',
            },
            {
              type: 'input',
              name: 'ip6_addr',
              placeholder: helptext.ip6_addr_placeholder,
              tooltip: helptext.ip6_addr_tooltip,
              validation: [regexValidator(this.networkService.ipv6_regex)],
              class: 'inline',
              width: '50%',
            },
            {
              type: 'select',
              name: 'ip6_prefix',
              placeholder: helptext.ip6_prefix_placeholder,
              tooltip: helptext.ip6_prefix_tooltip,
              options: this.networkService.getV6PrefixLength(),
              value: '',
              class: 'inline',
              width: '20%',
            },
          ],
          listFields: []
        },
        {
          type: 'input',
          name: 'defaultrouter6',
          placeholder: helptext.defaultrouter6_placeholder,
          tooltip: helptext.defaultrouter6_tooltip,
        },
        {
          type: 'input',
          name: 'notes',
          placeholder: helptext.notes_placeholder,
          tooltip: helptext.notes_tooltip,
        },
        {
          type: 'checkbox',
          name: 'boot',
          placeholder: helptext.boot_placeholder,
          tooltip: helptext.boot_tooltip,
        }
      ]
    },
    {
      name: helptext.fieldsets.jail,
      label: false,
      class: 'jail',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'devfs_ruleset',
          placeholder: helptext.devfs_ruleset_placeholder,
          tooltip: helptext.devfs_ruleset_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_start',
          placeholder: helptext.exec_start_placeholder,
          tooltip: helptext.exec_start_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_stop',
          placeholder: helptext.exec_stop_placeholder,
          tooltip: helptext.exec_stop_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_prestart',
          placeholder: helptext.exec_prestart_placeholder,
          tooltip: helptext.exec_prestart_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_poststart',
          placeholder: helptext.exec_poststart_placeholder,
          tooltip: helptext.exec_poststart_tooltip,
          class: 'inline',
          width: '50%',
        }, {
          type: 'input',
          name: 'exec_prestop',
          placeholder: helptext.exec_prestop_placeholder,
          tooltip: helptext.exec_prestop_tooltip,
          class: 'inline',
          width: '50%',
        }, {
          type: 'input',
          name: 'exec_poststop',
          placeholder: helptext.exec_poststop_placeholder,
          tooltip: helptext.exec_poststop_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_jail_user',
          placeholder: helptext.exec_jail_user_placeholder,
          tooltip: helptext.exec_jail_user_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'exec_system_user',
          placeholder: helptext.exec_system_user_placeholder,
          tooltip: helptext.exec_system_user_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'securelevel',
          placeholder: helptext.securelevel_placeholder,
          tooltip: helptext.securelevel_tooltip,
          options: [{
            label: '3',
            value: '3',
          }, {
            label: '2 (default)',
            value: '2',
          }, {
            label: '1',
            value: '1',
          }, {
            label: '0',
            value: '0',
          }, {
            label: '-1',
            value: '-1',
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'sysvmsg',
          placeholder: helptext.sysvmsg_placeholder,
          tooltip: helptext.sysvmsg_tooltip,
          options: [{
            label: 'Inherit',
            value: 'inherit',
          }, {
            label: 'New',
            value: 'new',
          }, {
            label: 'Disable',
            value: 'disable',
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'sysvsem',
          placeholder: helptext.sysvsem_placeholder,
          tooltip: helptext.sysvsem_tooltip,
          options: [{
            label: 'Inherit',
            value: 'inherit',
          }, {
            label: 'New',
            value: 'new',
          }, {
            label: 'Disable',
            value: 'disable',
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'sysvshm',
          placeholder: helptext.sysvshm_placeholder,
          tooltip: helptext.sysvshm_tooltip,
          options: [{
            label: 'Inherit',
            value: 'inherit',
          }, {
            label: 'New',
            value: 'new',
          }, {
            label: 'Disable',
            value: 'disable',
          }],
          class: 'inline',
          width: '50%',
        },

        {
          type: 'input',
          name: 'vnet_interfaces',
          placeholder: helptext.vnet_interfaces_placeholder,
          tooltip: helptext.vnet_interfaces_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'allow_set_hostname',
          placeholder: helptext.allow_set_hostname_placeholder,
          tooltip: helptext.allow_set_hostname_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_sysvipc',
          placeholder: helptext.allow_sysvipc_placeholder,
          tooltip: helptext.allow_sysvipc_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_raw_sockets',
          placeholder: helptext.allow_raw_sockets_placeholder,
          tooltip: helptext.allow_raw_sockets_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_chflags',
          placeholder: helptext.allow_chflags_placeholder,
          tooltip: helptext.allow_chflags_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_mlock',
          placeholder: helptext.allow_mlock_placeholder,
          tooltip: helptext.allow_mlock_tooltip,
        },


        {
          type: 'checkbox',
          name: 'allow_vmm',
          placeholder: helptext.allow_vmm_placeholder,
          tooltip: helptext.allow_vmm_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_quotas',
          placeholder: helptext.allow_quotas_placeholder,
          tooltip: helptext.allow_quotas_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_socket_af',
          placeholder: helptext.allow_socket_af_placeholder,
          tooltip: helptext.allow_socket_af_tooltip,
        },
        {
          type: 'checkbox',
          name: 'allow_mount',
          placeholder: helptext.allow_mount_placeholder,
          tooltip: helptext.allow_mount_tooltip,
        },
        {
          type: 'select',
          multiple: true,
          name: 'allow_mount_*',
          placeholder: T('allow_mount_*'),
          tooltip: '',
          options: [
            {
              value: 'allow_mount_devfs',
              label: helptext.allow_mount_devfs_placeholder,
              tooltip: helptext.allow_mount_devfs_tooltip,
            },
            {
              value: 'allow_mount_fusefs',
              label: helptext.allow_mount_fusefs_placeholder,
              tooltip: helptext.allow_mount_fusefs_tooltip,
            },
            {
              value: 'allow_mount_nullfs',
              label: helptext.allow_mount_nullfs_placeholder,
              tooltip: helptext.allow_mount_nullfs_tooltip,
            },
            {
              value: 'allow_mount_procfs',
              label: helptext.allow_mount_procfs_placeholder,
              tooltip: helptext.allow_mount_procfs_tooltip,
            },
            {
              value: 'allow_mount_tmpfs',
              label: helptext.allow_mount_tmpfs_placeholder,
              tooltip: helptext.allow_mount_tmpfs_tooltip,
            },
            {
              value: 'allow_mount_zfs',
              label: helptext.allow_mount_zfs_placeholder,
              tooltip: helptext.allow_mount_zfs_tooltip,
            }
          ]
        },
      ]
    },
    {
      name: helptext.fieldsets.network,
      label: false,
      class: 'network',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'interfaces',
          placeholder: helptext.interfaces_placeholder,
          tooltip: helptext.interfaces_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'host_domainname',
          placeholder: helptext.host_domainname_placeholder,
          tooltip: helptext.host_domainname_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'host_hostname',
          placeholder: helptext.host_hostname_placeholder,
          tooltip: helptext.host_hostname_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'resolver',
          placeholder: helptext.resolver_placeholder,
          tooltip: helptext.resolver_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'ip4_saddrsel',
          placeholder: helptext.ip4_saddrsel_placeholder,
          tooltip: helptext.ip4_saddrsel_tooltip,

        },
        {
          type: 'checkbox',
          name: 'ip6_saddrsel',
          placeholder: helptext.ip6_saddrsel_placeholder,
          tooltip: helptext.ip6_saddrsel_tooltip,
        },
        {
          type: 'select',
          name: 'ip4',
          placeholder: helptext.ip4_placeholder,
          tooltip: helptext.ip4_tooltip,
          options: [{
            label: 'Inherit',
            value: 'inherit',
          }, {
            label: 'New',
            value: 'new',
          }, {
            label: 'Disable',
            value: 'disable',
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'ip6',
          placeholder: helptext.ip6_placeholder,
          tooltip: helptext.ip6_tooltip,
          options: [{
            label: 'Inherit',
            value: 'inherit',
          }, {
            label: 'New',
            value: 'new',
          }, {
            label: 'Disable',
            value: 'disable',
          }],
          class: 'inline',
          width: '50%',
        },

        {
          type: 'input',
          name: 'mac_prefix',
          placeholder: helptext.mac_prefix_placeholder,
          tooltip: helptext.mac_prefix_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'select',
          name: 'vnet_default_interface',
          placeholder: helptext.vnet_default_interface_placeholder,
          tooltip: helptext.vnet_default_interface_tooltip,
          options: this.interfaces.vnetDefaultInterface,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'vnet0_mac',
          placeholder: helptext.vnet0_mac_placeholder,
          tooltip: helptext.vnet0_mac_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'nat_interface',
          placeholder: helptext.nat_interface_placeholder,
          tooltip: helptext.nat_interface_tooltip,
          relation: [{
            action: "SHOW",
            when: [{
              name: "nat",
              value: true,
            }]
          }],
          class: 'inline',
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'nat_forwards_checkbox',
          placeholder: helptext.nat_forwards_placeholder,
          tooltip: helptext.nat_forwards_tooltip,
          relation: [{
            action: "SHOW",
            when: [{
              name: "nat",
              value: true,
            }]
          }],
        },
        {
          type: 'list',
          name: 'nat_forwards',
          placeholder: 'nat_forwards',
          relation: [{
            action: "SHOW",
            connective: 'AND',
            when: [{
              name: "nat",
              value: true,
            }, {
              name: 'nat_forwards_checkbox',
              value: true,
            }]
          }],
          templateListField: [
            {
              type: 'select',
              name: 'protocol',
              placeholder: helptext.protocol_placeholder,
              tooltip: helptext.protocol_tooltip,
              options: [{
                label: 'udp',
                value: 'udp',
              }, {
                label: 'tcp',
                value: 'tcp',
              }],
              class: 'inline',
              width: '30%',
            },
            {
              type: 'input',
              inputType: 'number',
              name: 'jail_port',
              placeholder: helptext.jail_port_placeholder,
              tooltip: helptext.jail_port_tooltip,
              class: 'inline',
              width: '50%',
            },
            {
              type: 'input',
              inputType: 'number',
              name: 'host_port',
              placeholder: helptext.host_port_placeholder,
              tooltip: helptext.host_port_tooltip,
              class: 'inline',
              width: '20%',
            }
          ],
          listFields: [],
          disabled: true,
        },
      ]
    },
    {
      name: helptext.fieldsets.custom,
      label: false,
      class: 'custom',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'priority',
          placeholder: helptext.priority_placeholder,
          tooltip: helptext.priority_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'hostid',
          placeholder: helptext.hostid_placeholder,
          tooltip: helptext.hostid_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'comment',
          placeholder: helptext.comment_placeholder,
          tooltip: helptext.comment_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'template',
          placeholder: helptext.template_placeholder,
          tooltip: helptext.template_tooltip,
        },
        {
          type: 'checkbox',
          name: 'host_time',
          placeholder: helptext.host_time_placeholder,
          tooltip: helptext.host_time_tooltip,
        },
        {
          type: 'checkbox',
          name: 'jail_zfs',
          placeholder: helptext.jail_zfs_placeholder,
          tooltip: helptext.jail_zfs_tooltip,
        },
        {
          type: 'input',
          name: 'jail_zfs_dataset',
          placeholder: helptext.jail_zfs_dataset_placeholder,
          tooltip: helptext.jail_zfs_dataset_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'input',
          name: 'jail_zfs_mountpoint',
          placeholder: helptext.jail_zfs_mountpoint_placeholder,
          tooltip: helptext.jail_zfs_mountpoint_tooltip,
          class: 'inline',
          width: '50%',
        },
        {
          type: 'checkbox',
          name: 'allow_tun',
          placeholder: helptext.allow_tun_placeholder,
          tooltip: helptext.allow_tun_tooltip,
        },
        {
          type: 'checkbox',
          name: 'rtsold',
          placeholder: helptext.rtsold_placeholder,
          tooltip: helptext.rtsold_tooltip,
        },
        {
          type: 'checkbox',
          name: 'ip_hostname',
          placeholder: helptext.ip_hostname_placeholder,
          tooltip: helptext.ip_hostname_tooltip,
        },
        {
          type: 'checkbox',
          name: 'assign_localhost',
          placeholder: helptext.assign_localhost_placeholder,
          tooltip: helptext.assign_localhost_tooltip,
        },
      ]
    }
  ];

  public basicfieldConfig = _.find(this.fieldSets, { class: 'basic' }).config;
  public jailfieldConfig = _.find(this.fieldSets, { class: 'jail' }).config;
  public networkfieldConfig = _.find(this.fieldSets, { class: 'network' }).config;
  public customConfig = _.find(this.fieldSets, { class: 'custom' }).config;
  protected formFields = _.concat(this.basicfieldConfig, this.jailfieldConfig, this.networkfieldConfig, this.customConfig);

  public step: any = 0;

  protected releaseField = _.find(this.basicfieldConfig, { 'name': 'release' });
  protected ip4_interfaceField = _.find(this.basicfieldConfig, { 'name': 'ip4_addr' }).templateListField[0];
  protected ip6_interfaceField = _.find(this.basicfieldConfig, { 'name': 'ip6_addr' }).templateListField[0];
  protected vnet_default_interfaceField = _.find(this.networkfieldConfig, { 'name': 'vnet_default_interface' });
  protected template_list: string[];
  protected unfetchedRelease = [];
  public showSpinner = true;

  public save_button_enabled: boolean;
  protected isPlugin = false;
  protected wsResponse: any;
  public pk: any;
  protected currentReleaseVersion: any;
  protected currentServerVersion: any;
  public plugin: any;
  protected pluginRepository: any;

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected jailService: JailService,
    protected jailFromService: JailFormService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected networkService: NetworkService) { }

  getReleaseAndInterface() {
    if (this.plugin !== undefined) {
      this.jailFromService.getInterface().subscribe(
        (res) => {
          for (let i in res) {
            this.interfaces.vnetDisabled.push({ label: res[i].name, value: res[i].name });
          }
        },
        (res) => {
          new EntityUtils().handleWSError(this, res, this.dialogService);
        }
      );
    } else {
      this.template_list = new Array<string>();
      // get jail templates as release options
      this.jailService.getTemplates().subscribe(
        (templates) => {
          for (const template of templates) {
            this.template_list.push(template.host_hostuuid);
            this.releaseField.options.push({ label: template.host_hostuuid + ' (template)', value: template.host_hostuuid });
          }
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        }
      )

      this.jailService.getReleaseChoices().subscribe(
        (releases) => {
          for (const item in releases) {
            this.releaseField.options.push({ label: item, value: releases[item] });
          }
        },
        (err) => {
          new EntityUtils().handleWSError(this, err, this.dialogService);
        }
      );

      this.jailService.getInterfaceChoice().subscribe(
        (res) => {
          for (const i in res) {
            this.interfaces.vnetDisabled.push({ label: res[i], value: res[i] });
          }
        },
        (res) => {
          new EntityUtils().handleWSError(this, res, this.dialogService);
        }
      );
    }
  }

  setValuechange() {
    const httpsField = _.find(this.formFields, { 'name': 'https' });
    this.formGroup.controls['release'].valueChanges.subscribe((res) => {
      httpsField.isHidden = _.indexOf(this.unfetchedRelease, res) > -1 ? false : true;
    });

    this.formGroup.controls['dhcp'].valueChanges.subscribe((res) => {
      ['vnet', 'bpf'].forEach((item) => {
        if (res) {
          this.formGroup.controls[item].setValue(res);
        }
        _.find(this.basicfieldConfig, { 'name': item }).required = res;
        if (this.formGroup.controls['nat'].disabled !== res && (this.wsResponse && this.wsResponse.state !== 'up')) {
          this.jailFromService.setDisabled(this.formGroup, this.formFields, 'nat', res);
        }
      })
    });

    const vnetFieldConfig = _.find(this.basicfieldConfig, { 'name': 'vnet' });
    this.formGroup.controls['nat'].valueChanges.subscribe((res) => {
      if (res) {
        this.formGroup.controls['vnet'].setValue(res);
      }
      vnetFieldConfig.required = res;
    });

    this.formGroup.controls['vnet'].valueChanges.subscribe((res) => {
      const hasError = (!res && (
        (this.formGroup.controls['dhcp'].value || this.formGroup.controls['nat'].value) ||
        this.formGroup.controls['auto_configure_ip6'].value)) ? true : false;

      vnetFieldConfig.hasErrors = hasError;
      vnetFieldConfig.errors = hasError ? T('VNET is required.') : '';
      this.ip4_interfaceField.options = res ? this.interfaces.vnetEnabled : this.interfaces.vnetDisabled;
      this.ip6_interfaceField.options = res ? this.interfaces.vnetEnabled : this.interfaces.vnetDisabled;
      this.jailFromService.updateInterface(this.formGroup, this.basicfieldConfig, res);
    });

    const bpfFieldConfig = _.find(this.basicfieldConfig, { 'name': 'bpf' });
    this.formGroup.controls['bpf'].valueChanges.subscribe((res) => {
      const hasError = (!res && this.formGroup.controls['dhcp'].value) ? true : false;
      bpfFieldConfig.hasErrors = hasError;
      bpfFieldConfig.errors = hasError ? T('BPF is required.') : '';
    });

    this.formGroup.controls['auto_configure_ip6'].valueChanges.subscribe((res) => {
      this.formGroup.controls['vnet'].setValue(res ? true : this.formGroup.controls['vnet'].value);
      _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = res;
    });

    ['ip4_addr', 'ip6_addr'].forEach((item) => {
      this.formGroup.controls[item].valueChanges.subscribe((res) => {
        this.jailFromService.updateInterface(this.formGroup, this.basicfieldConfig);
      });
    });
  }

  loadInterfaces(res, i) {
    if (i === 'interfaces') {
      const ventInterfaces = res['interfaces'].split(',');
      for (const item of ventInterfaces) {
        this.interfaces.vnetEnabled.push({ label: item, value: item });
        this.interfaces.vnetDefaultInterface.push({ label: item, value: item });
      }
    }
  }

  loadFormValue() {
    if (this.pk === undefined) {
      this.jailService.getDefaultConfiguration().subscribe(
        (res) => {
          this.save_button_enabled = true;
          for (let i in res) {
            this.loadInterfaces(res, i);
            if (this.formGroup.controls[i]) {
              if ((i == 'ip4_addr' || i == 'ip6_addr') && res[i] == 'none') {
                continue;
              }
              this.jailFromService.handleTFfiledValues(res, i);
              if (i === 'nat_forwards') {
                this.jailFromService.deparseNatForwards(res[i], this.formGroup, this.networkfieldConfig);
              } else {
                this.formGroup.controls[i].setValue(res[i]);
              }
            }
          }
          if (this.plugin !== undefined) {
            this.formGroup.controls['plugin_name'].setValue(this.plugin);
            this.jailFromService.getPluginDefaults(this.plugin, this.pluginRepository, this.formGroup, this.networkfieldConfig);
          }
          this.showSpinner = false;
        },
        (res) => {
          new EntityUtils().handleError(this, res);
        });
    } else {
      this.ws.call(this.queryCall, [[["host_hostuuid", "=", this.pk]]]).subscribe(
        (res) => {
          this.wsResponse = res[0];
          if (res[0] && res[0].state == 'up') {
            this.save_button_enabled = false;
            this.error = T("Jails cannot be changed while running.");
            for (let i = 0; i < this.formFields.length; i++) {
              this.jailFromService.setDisabled(this.formGroup, this.formFields, this.formFields[i].name, true, this.formFields[i].isHidden);
            }
          } else {
            this.save_button_enabled = true;
            this.error = "";
          }
          const allowMountList = [];
          for (let i in res[0]) {
            this.loadInterfaces(res[0], i);
            if (_.startsWith(i, 'allow_mount_') && res[0][i] === 1) {
              allowMountList.push(i);
            }
            if (this.formGroup.controls[i]) {
              if (i == 'ip4_addr' || i == 'ip6_addr') {
                this.jailFromService.deparseIpaddr(res[0][i], i.split('_')[0], this.formGroup, this.basicfieldConfig);
                continue;
              }
              if (i === 'nat_forwards') {
                this.jailFromService.deparseNatForwards(res[0][i], this.formGroup, this.networkfieldConfig);
                continue;
              }
              if (i == 'release') {
                _.find(this.basicfieldConfig, { 'name': 'release' }).options.push({ label: res[0][i], value: res[0][i] });
                this.currentReleaseVersion = Number(_.split(res[0][i], '-')[0]);
              }
              this.jailFromService.handleTFfiledValues(res[0], i);
              this.formGroup.controls[i].setValue(res[0][i]);
            }
            if (i == 'type') {
              if (res[0][i] == 'pluginv2') {
                this.jailFromService.setDisabled(this.formGroup, this.formFields, "uuid", true);
                this.isPlugin = true;
              }
              this.jailFromService.setDisabled(this.formGroup, this.formFields, 'plugin_name', true, !this.isPlugin);
            }
          }
          this.formGroup.controls['dhcp'].setValue(res[0]['dhcp']);
          this.formGroup.controls['nat'].setValue(res[0]['nat']);
          this.formGroup.controls['uuid'].setValue(res[0]['host_hostuuid']);
          this.formGroup.controls['allow_mount_*'].setValue(allowMountList);
          this.showSpinner = false;
        },
        (res) => {
          new EntityUtils().handleWSError(this, res, this.dialogService);
        });
    }
  }

  async ngOnInit() {
    this.formGroup = this.jailFromService.createForm(this.formFields);
    this.aroute.params.subscribe(async params => {
      this.pk = params['pk'];
      this.plugin = params['plugin'];
      this.getReleaseAndInterface();

      if (this.pk !== undefined || this.plugin !== undefined) {
        this.jailFromService.setDisabled(this.formGroup, this.formFields, 'jailtype', true, true);
        this.jailFromService.setDisabled(this.formGroup, this.formFields, 'release', true, this.pk !== undefined ? false : true);
        this.jailFromService.setDisabled(this.formGroup, this.formFields, 'https', true, true);

        if (this.plugin !== undefined) {
          this.formGroup.controls['plugin_name'].setValue(this.plugin);
          this.pluginRepository = params['plugin_repository'];
        }
      } else {
        this.jailFromService.setDisabled(this.formGroup, this.formFields, 'plugin_name', true, true);
      }

      await this.jailService.listJails().toPromise().then((res) => {
        res.forEach(i => {
          if (i.id !== this.pk) {
            this.namesInUse.push(i.id);
          }
        });
      });

      this.setValuechange();
      this.loadFormValue();
    })
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.isReady = true;
      this.setStep(0);
    }, 100);

    for (const ipType of ['ip4', 'ip6']) {
      const targetPropName = ipType + '_addr';
      for (let i = 0; i < this.formGroup.controls[targetPropName].controls.length; i++) {
        const subipInterfaceField = _.find(_.find(this.basicfieldConfig, { 'name': targetPropName }).listFields[i], { 'name': ipType + '_interface' });
        subipInterfaceField.options = ipType === 'ip4' ? this.ip4_interfaceField.options : this.ip6_interfaceField.options;
      }
    }

    this.formGroup.controls['dhcp'].setValue(this.formGroup.controls['dhcp'].value);
    this.formGroup.controls['nat'].setValue(this.formGroup.controls['nat'].value);
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.plugin === undefined ? this.route_success : this.plugin_route_success));
  }

  openJobDialog(type: 'pluginInstall' | 'jailInstall' | 'jailEdit', wsCall, payload) {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": helptext.jailFormJobDialog[type].title }, disableClose: true });
    dialogRef.componentInstance.setDescription(helptext.jailFormJobDialog[type].description);
    dialogRef.componentInstance.setCall(wsCall, payload);
    dialogRef.componentInstance.submit();
    return dialogRef;
  }

  onSubmit(event: Event) {
    let updateRelease = false;
    let newRelease: any;
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    const property: any = [];
    const value = _.cloneDeep(this.formGroup.value);

    this.jailFromService.parseIpaddr(value, this.ip4_interfaceField, this.ip6_interfaceField);
    this.jailFromService.parseNatForwards(value);

    if (value['auto_configure_ip6']) {
      value['ip6_addr'] = "vnet0|accept_rtadv";
    }
    delete value['auto_configure_ip6'];

    if (value['allow_mount_*']) {
      for (const i of value['allow_mount_*']) {
        value[i] = true;
      }
      delete value['allow_mount_*'];
    }

    if (this.pk === undefined) {
      if (value['jailtype'] === 'basejail') {
        value['basejail'] = true;
      }
      delete value['jailtype'];

      for (let i in value) {
        if (value.hasOwnProperty(i)) {
          if (value[i] == undefined) {
            delete value[i];
          } else {
            if (_.indexOf(this.jailFromService.TFfields, i) > -1) {
              property.push(i + (value[i] ? '=1' : '=0'));
              delete value[i];
            } else {
              if (i != 'uuid' && i != 'release' && i != 'basejail' && i != 'https') {
                property.push(i + '=' + value[i]);
                delete value[i];
              }
            }
          }
        }
      }
      if (this.plugin !== undefined) {
        value['plugin_name'] = this.plugin;
        value['plugin_repository'] = this.pluginRepository;
      }

      value['props'] = property;
      if (_.indexOf(this.template_list, value['release']) > -1) {
        value['template'] = value['release'];
      }
    } else {
      for (const i in this.wsResponse) {
        if (value[i] == undefined && _.find(this.formFields, { name: i }) != undefined && i !== 'host_hostuuid' && i !== 'release') {
          if (this.wsResponse[i] === true) {
            value[i] = false;
          }
        } else {
          if (_.startsWith(i, 'allow_mount_')) {
            if (value[i] === undefined) {
              value[i] = 0;
            }
          }
          // do not send value[i] if value[i] no change
          if (value[i] == this.wsResponse[i] || (i === 'host_hostuuid' && value['uuid'] === this.wsResponse[i])) {
            i === 'host_hostuuid' ? delete value['uuid'] : delete value[i];
          }
        }

        if (value.hasOwnProperty(i)) {
          if (i == 'release') {
            // upgrade release
            updateRelease = true;
            newRelease = value[i];
            delete value[i];
          }
          if (_.indexOf(this.jailFromService.TFfields, i) > -1) {
            value[i] = value[i] ? 1 : 0;
          }
        }
      }
      if (value['uuid']) {
        value['name'] = value['uuid'];
        delete value['uuid'];
      }
    }
    if (this.plugin !== undefined) {
      value['jail_name'] = value['uuid'];
      delete value['uuid'];

      const dialogRef = this.openJobDialog('pluginInstall', this.pluginAddCall, [value]);
      dialogRef.componentInstance.success.subscribe((res) => {
        dialogRef.componentInstance.setTitle(T("Plugin Installed Successfully"));
        let install_notes = '<p><b>Install Notes:</b></p>';
        for (const msg of res.result.install_notes.split('\n')) {
          install_notes += '<p>' + msg + '</p>';
        }
        dialogRef.componentInstance.setDescription(install_notes);
        dialogRef.componentInstance.showCloseButton = true;

        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(new Array('/').concat(this.plugin_route_success));
        });
      });
    } else if (this.pk === undefined) {
      const dialogRef = this.openJobDialog('jailInstall', this.addCall, [value]);
      dialogRef.componentInstance.success.subscribe((res) => {
        dialogRef.close(true);
        this.router.navigate(new Array('/').concat(this.route_success));
      });
      dialogRef.componentInstance.failure.subscribe((res) => {
        dialogRef.close();
        // show error inline if error is EINVAL
        if (res.error.indexOf('[EINVAL]') > -1) {
          res.error = res.error.substring(9).split(':');
          const field = res.error[0];
          const error = res.error[1];
          const fc = _.find(this.formFields, { 'name': field });
          if (fc && !fc['isHidden']) {
            fc['hasErrors'] = true;
            fc['errors'] = error;
          }
        } else {
          new EntityUtils().handleWSError(this, res, this.dialogService);
        }
      });
    } else {
      this.loader.open();
      this.ws.call(this.updateCall, [this.pk, value]).subscribe(
        (res) => {
          this.loader.close();
          if (updateRelease) {
            const option = {
              'release': newRelease,
              'plugin': this.isPlugin,
            }
            const dialogRef = this.openJobDialog('jailEdit', this.upgradeCall, [this.pk, option]);
            dialogRef.componentInstance.success.subscribe((dialogRes) => {
              dialogRef.close(true);
              this.router.navigate(new Array('/').concat(this.route_success));
            });
          } else {
            if (res.error) {
              new EntityUtils().handleWSError(this, res, this.dialogService);
            } else {
              this.router.navigate(new Array('/').concat(this.route_success));
            }
          }
        },
        (res) => {
          this.loader.close();
          new EntityUtils().handleWSError(this, res, this.dialogService);
        }
      );
    }
  }

  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
}
