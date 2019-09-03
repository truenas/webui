import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService, DialogService, NetworkService, WebSocketService, AppLoaderService } from '../../../services/';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';
import { TranslateService } from '@ngx-translate/core';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import helptext from '../../../helptext/jails/jail-configuration';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'jail-edit',
  templateUrl: './jail-edit.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss'],
  providers: [JailService, EntityFormService, FieldRelationService, NetworkService]
})
export class JailEditComponent implements OnInit, AfterViewInit {

  @ViewChild('basic', { static: true}) basicPanel:any;
  public isReady: boolean =  false;
  protected updateCall = 'jail.do_update';
  protected upgradeCall = 'jail.upgrade';
  protected queryCall = 'jail.query';
  public route_success: string[] = ['jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public busy: Subscription;
  public custActions: any;
  public pk: any;

  protected formFileds: FieldConfig[];
  public basicfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'host_hostuuid',
      placeholder: helptext.host_hostuuid_placeholder,
      tooltip: helptext.host_hostuuid_tooltip,
      required: true,
      disabled: false,
      validation: [ Validators.required, regexValidator(this.jailService.jailNameRegex) ],
    },
    {
      type: 'select',
      name: 'release',
      placeholder: helptext.release_placeholder,
      tooltip: helptext.release_tooltip,
      options: [],
      required: true,
      validation: [ Validators.required ],
      disabled: true,
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: helptext.dhcp_placeholder,
      tooltip: helptext.dhcp_tooltip,
      disabled: false,
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
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'bpf',
      placeholder: helptext.bpf_placeholder,
      tooltip: helptext.bpf_tooltip,
      disabled: false,
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
          options: [{
            label: '------',
            value: '',
          }],
          value: '',
          class: 'inline',
          width: '30%',
        },
        {
          type: 'input',
          name: 'ip4_addr',
          placeholder: helptext.ip4_addr_placeholder,
          tooltip: helptext.ip4_addr_tooltip,
          validation : [ regexValidator(this.networkService.ipv4_regex) ],
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
      }],
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'auto_configure_ip6',
      placeholder: helptext.auto_configure_ip6_placeholder,
      tooltip: helptext.auto_configure_ip6_tooltip,
      disabled: false,
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
          options: [{
            label: '------',
            value: '',
          }],
          value: '',
          class: 'inline',
          width: '30%',
        },
        {
          type: 'input',
          name: 'ip6_addr',
          placeholder: helptext.ip6_addr_placeholder,
          tooltip: helptext.ip6_addr_tooltip,
          validation : [ regexValidator(this.networkService.ipv6_regex) ],
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
      disabled: false,
    },
    {
      type: 'input',
      name: 'notes',
      placeholder: helptext.notes_placeholder,
      tooltip: helptext.notes_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'boot',
      placeholder: helptext.boot_placeholder,
      tooltip: helptext.boot_tooltip,
      disabled: false,
    }
  ];
  public jailfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'devfs_ruleset',
      placeholder: helptext.devfs_ruleset_placeholder,
      tooltip: helptext.devfs_ruleset_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_start',
      placeholder: helptext.exec_start_placeholder,
      tooltip: helptext.exec_start_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_stop',
      placeholder: helptext.exec_stop_placeholder,
      tooltip: helptext.exec_stop_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_prestart',
      placeholder: helptext.exec_prestart_placeholder,
      tooltip: helptext.exec_prestart_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_poststart',
      placeholder: helptext.exec_poststart_placeholder,
      tooltip: helptext.exec_poststart_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_prestop',
      placeholder: helptext.exec_prestop_placeholder,
      tooltip: helptext.exec_prestop_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_poststop',
      placeholder: helptext.exec_poststop_placeholder,
      tooltip: helptext.exec_poststop_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'exec_clean',
      placeholder: helptext.exec_clean_placeholder,
      tooltip: helptext.exec_clean_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_timeout',
      placeholder: helptext.exec_timeout_placeholder,
      tooltip: helptext.exec_timeout_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'stop_timeout',
      placeholder: helptext.stop_timeout_placeholder,
      tooltip: helptext.stop_timeout_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_jail_user',
      placeholder: helptext.exec_jail_user_placeholder,
      tooltip: helptext.exec_jail_user_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_system_jail_user',
      placeholder: helptext.exec_system_jail_user_placeholder,
      tooltip: helptext.exec_system_jail_user_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_system_user',
      placeholder: helptext.exec_system_user_placeholder,
      tooltip: helptext.exec_system_user_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'mount_devfs',
      placeholder: helptext.mount_devfs_placeholder,
      tooltip: helptext.mount_devfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'mount_fdescfs',
      placeholder: helptext.mount_fdescfs_placeholder,
      tooltip: helptext.mount_fdescfs_tooltip,
      disabled: false,
    },
    {
      //"enforce_statfs": ("0", "1", "2"),
      type: 'select',
      name: 'enforce_statfs',
      placeholder: helptext.enforce_statfs_placeholder,
      tooltip: helptext.enforce_statfs_tooltip,
        options: [{
            label: '0',
            value: '0',
        }, {
            label: '1',
            value: '1',
        }, {
            label: '2 (default)',
            value: '2',
        }],
      disabled: false,
    },
    {
      type: 'input',
      name: 'children_max',
      placeholder: helptext.children_max_placeholder,
      tooltip: helptext.children_max_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'login_flags',
      placeholder: helptext.login_flags_placeholder,
      tooltip: helptext.login_flags_tooltip,
      disabled: false,
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
      disabled: false,
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
      disabled: false,
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
      disabled: false,
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
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_set_hostname',
      placeholder: helptext.allow_set_hostname_placeholder,
      tooltip: helptext.allow_set_hostname_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_sysvipc',
      placeholder: helptext.allow_sysvipc_placeholder,
      tooltip: helptext.allow_sysvipc_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_raw_sockets',
      placeholder: helptext.allow_raw_sockets_placeholder,
      tooltip: helptext.allow_raw_sockets_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_chflags',
      placeholder: helptext.allow_chflags_placeholder,
      tooltip: helptext.allow_chflags_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mlock',
      placeholder: helptext.allow_mlock_placeholder,
      tooltip: helptext.allow_mlock_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow_mount',
      placeholder: helptext.allow_mount_placeholder,
      tooltip: helptext.allow_mount_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_devfs',
      placeholder: helptext.allow_mount_devfs_placeholder,
      tooltip: helptext.allow_mount_devfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_fusefs',
      placeholder: helptext.allow_mount_fusefs_placeholder,
      tooltip: helptext.allow_mount_fusefs_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_nullfs',
      placeholder: helptext.allow_mount_nullfs_placeholder,
      tooltip: helptext.allow_mount_nullfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_procfs',
      placeholder: helptext.allow_mount_procfs_placeholder,
      tooltip: helptext.allow_mount_procfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_tmpfs',
      placeholder: helptext.allow_mount_tmpfs_placeholder,
      tooltip: helptext.allow_mount_tmpfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_zfs',
      placeholder: helptext.allow_mount_zfs_placeholder,
      tooltip: helptext.allow_mount_zfs_tooltip,
      disabled: false,
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
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'allow_socket_af',
      placeholder: helptext.allow_socket_af_placeholder,
      tooltip: helptext.allow_socket_af_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'vnet_interfaces',
      placeholder: helptext.vnet_interfaces_placeholder,
      tooltip: helptext.vnet_interfaces_tooltip,
      disabled: false,
    }
  ];
  public networkfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'interfaces',
      placeholder: helptext.interfaces_placeholder,
      tooltip: helptext.interfaces_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'host_domainname',
      placeholder: helptext.host_domainname_placeholder,
      tooltip: helptext.host_domainname_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: helptext.host_hostname_placeholder,
      tooltip: helptext.host_hostname_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'exec_fib',
      placeholder: helptext.exec_fib_placeholder,
      tooltip: helptext.exec_fib_tooltip,
      disabled: false,
//There is SETFIB(1) that is network related, and SETFIB(2) that
//is system call related. As this tooltip is under the jail
//networking section, I went with SETFIB(1) the network related
//man page.
    },
    {
      type: 'checkbox',
      name: 'ip4_saddrsel',
      placeholder: helptext.ip4_saddrsel_placeholder,
      tooltip: helptext.ip4_saddrsel_tooltip,
      disabled: false,
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
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'ip6_saddrsel',
      placeholder: helptext.ip6_saddrsel_placeholder,
      tooltip: helptext.ip6_saddrsel_tooltip,
      disabled: false,
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
      disabled: false,
    },
    {
      type: 'input',
      name: 'resolver',
      placeholder: helptext.resolver_placeholder,
      tooltip: helptext.resolver_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'mac_prefix',
      placeholder: helptext.mac_prefix_placeholder,
      tooltip: helptext.mac_prefix_tooltip,
      disabled: false,
    },
    {
      type: 'select',
      name: 'vnet_default_interface',
      placeholder: helptext.vnet_default_interface_placeholder,
      tooltip: helptext.vnet_default_interface_tooltip,
      options: [
        {
          label: 'none',
          value: 'none',
        },
        {
          label: 'auto',
          value: 'auto',
        }
      ],
      disabled: false,
    },
    {
      type: 'input',
      name: 'vnet0_mac',
      placeholder: helptext.vnet0_mac_placeholder,
      tooltip: helptext.vnet0_mac_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'vnet1_mac',
      placeholder: helptext.vnet1_mac_placeholder,
      tooltip: helptext.vnet1_mac_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'vnet2_mac',
      placeholder: helptext.vnet2_mac_placeholder,
      tooltip: helptext.vnet2_mac_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'vnet3_mac',
      placeholder: helptext.vnet3_mac_placeholder,
      tooltip: helptext.vnet3_mac_tooltip,
      disabled: false,
    },
  ];
  public customConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'owner',
      placeholder: helptext.owner_placeholder,
      tooltip: helptext.owner_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'priority',
      placeholder: helptext.priority_placeholder,
      tooltip: helptext.priority_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'hostid',
      placeholder: helptext.hostid_placeholder,
      tooltip: helptext.hostid_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'hostid_strict_check',
      placeholder: helptext.hostid_strict_check_placeholder,
      tooltip: helptext.hostid_strict_check_tooltip,
    },
    {
      type: 'input',
      name: 'comment',
      placeholder: helptext.comment_placeholder,
      tooltip: helptext.comment_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'depends',
      placeholder: helptext.depends_placeholder,
      tooltip: helptext.depends_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'mount_procfs',
      placeholder: helptext.mount_procfs_placeholder,
      tooltip: helptext.mount_procfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'mount_linprocfs',
      placeholder: helptext.mount_linprocfs_placeholder,
      tooltip: helptext.mount_linprocfs_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'template',
      placeholder: helptext.template_placeholder,
      tooltip: helptext.template_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'host_time',
      placeholder: helptext.host_time_placeholder,
      tooltip: helptext.host_time_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'jail_zfs',
      placeholder: helptext.jail_zfs_placeholder,
      tooltip: helptext.jail_zfs_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'jail_zfs_dataset',
      placeholder: helptext.jail_zfs_dataset_placeholder,
      tooltip: helptext.jail_zfs_dataset_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'jail_zfs_mountpoint',
      placeholder: helptext.jail_zfs_mountpoint_placeholder,
      tooltip: helptext.jail_zfs_mountpoint_tooltip,
      disabled: false,
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
  ];
  public rctlConfig: FieldConfig[] = [
// Spoke to Lola. Lines below starting here down to the "wallclock"
// tooltip are commented out in jail-add.component, and are also
// commented out of the HTML for the jail-edit page. Adding this comment
// to clarify why these aren't reviewed currently.

    {
      type: 'input',
      name: 'memoryuse',
      placeholder: helptext.memoryuse_placeholder,
      tooltip: helptext.memoryuse_tooltip,
      disabled: false,
    },
    {
      type: 'input',
      name: 'pcpu',
      placeholder: helptext.pcpu_placeholder,
      tooltip: helptext.pcpu_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'cpuset',
      placeholder: helptext.cpuset_placeholder,
      tooltip: helptext.cpuset_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'rlimits',
      placeholder: helptext.rlimits_placeholder,
      tooltip: helptext.rlimits_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'memorylocked',
      placeholder: helptext.memorylocked_placeholder,
      tooltip: helptext.memorylocked_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'vmemoryuse',
      placeholder: helptext.vmemoryuse_placeholder,
      tooltip: helptext.vmemoryuse_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'maxproc',
      placeholder: helptext.maxproc_placeholder,
      tooltip: helptext.maxproc_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'cputime',
      placeholder: helptext.cputime_placeholder,
      tooltip: helptext.cputime_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'datasize',
      placeholder: helptext.datasize_placeholder,
      tooltip: helptext.datasize_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'stacksize',
      placeholder: helptext.stacksize_placeholder,
      tooltip: helptext.stacksize_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'coredumpsize',
      placeholder: helptext.coredumpsize_placeholder,
      tooltip: helptext.coredumpsize_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'openfiles',
      placeholder: helptext.openfiles_placeholder,
      tooltip: helptext.openfiles_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'pseudoterminals',
      placeholder: helptext.pseudoterminals_placeholder,
      tooltip: helptext.pseudoterminals_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'swapuse',
      placeholder: helptext.swapuse_placeholder,
      tooltip: helptext.swapuse_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'nthr',
      placeholder: helptext.nthr_placeholder,
      tooltip: helptext.nthr_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'msgqqueued',
      placeholder: helptext.msgqqueued_placeholder,
      tooltip: helptext.msgqqueued_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'msgqsize',
      placeholder: helptext.msgqsize_placeholder,
      tooltip: helptext.msgqsize_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'nmsgq',
      placeholder: helptext.nmsgq_placeholder,
      tooltip: helptext.nmsgq_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'nsemop',
      placeholder: helptext.nsemop_placeholder,
      tooltip: helptext.nsemop_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'nshm',
      placeholder: helptext.nshm_placeholder,
      tooltip: helptext.nshm_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'shmsize',
      placeholder: helptext.shmsize_placeholder,
      tooltip: helptext.shmsize_tooltip,
      disabled: false,
    },
    {
      type: 'checkbox',
      name: 'wallclock',
      placeholder: helptext.wallclock_placeholder,
      tooltip: helptext.wallclock_tooltip,
      disabled: false,
    }
  ];
  protected props: any;
  protected releaseField: any;
  public step: any = 0;
  protected wsResponse: any;

  // fields only accepted by ws with value 0/1
  protected TFfields: any = [
    'bpf',
    'template',
    'host_time',
    'dhcp',
    'vnet',
    'rtsold',
    'jail_zfs',
    'hostid_strict_check',
    'boot',
    'exec_clean',
    'mount_linprocfs',
    'mount_procfs',
    'allow_vmm',
    'allow_tun',
    'allow_socket_af',
    'allow_quotas',
    'allow_mount_zfs',
    'allow_mount_tmpfs',
    'allow_mount_procfs',
    'allow_mount_nullfs',
    'allow_mount_fusefs',
    'allow_mount_devfs',
    'allow_mount',
    'allow_mlock',
    'allow_chflags',
    'allow_raw_sockets',
    'allow_sysvipc',
    'allow_set_hostname',
    'mount_fdescfs',
    'mount_devfs',
    'ip6_saddrsel',
    'ip4_saddrsel',
    'ip_hostname',
    'assign_localhost',
    'nat',
  ];
  // fields only accepted by ws with value on/off
  protected OFfields: any = [
    'cpuset',
    'rlimits',
    'memorylocked',
    'vmemoryuse',
    'maxproc',
    'cputime',
    'datasize',
    'stacksize',
    'coredumpsize',
    'openfiles',
    'pseudoterminals',
    'swapuse',
    'nthr',
    'msgqqueued',
    'msgqsize',
    'nmsgq',
    'nsemop',
    'nshm',
    'shmsize',
    'wallclock',
  ];

  protected currentReleaseVersion: any;
  protected currentServerVersion: any;
  protected ip4_interfaceField: any;
  protected ip4_netmaskField: any;
  protected ip6_interfaceField: any;
  protected ip6_prefixField: any;
  protected vnet_default_interfaceField:any;
  public save_button_enabled: boolean;
  public error: any;
  protected isPlugin = false;

  constructor(protected router: Router,
    protected aroute: ActivatedRoute,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialogService: DialogService,
    protected networkService: NetworkService,
    protected dialog: MatDialog,) {}

  isLowerVersion(version: any) {
    if (version < this.currentReleaseVersion) {
      return true;
    }
    return false;
  }

  updateInterfaceOptions(interfaceField, addVnet) {
    if (addVnet != undefined) {
      const index = _.findIndex(interfaceField.options as any, { 'label': 'vnet0'});
      if (addVnet && index == -1) {
        interfaceField.options.push({ label: 'vnet0', value: 'vnet0'});
      } else if (!addVnet && index > -1){
        interfaceField.options.splice(index, 1);
      }
    }
  }

  updateInterface(addVnet?) {
    for (const ipType of ['ip4', 'ip6']) {
      const targetPropName = ipType + '_addr';
      for (let i = 0; i < this.formGroup.controls[targetPropName].controls.length; i++) {
        const subipFormgroup = this.formGroup.controls[targetPropName].controls[i];
        const subipInterfaceField = _.find(_.find(this.basicfieldConfig, {'name': targetPropName}).listFields[i], {'name': ipType + '_interface'});

        if (addVnet != undefined) {
          this.updateInterfaceOptions(subipInterfaceField, addVnet);
        }
      }
    }
  }

  ngAfterViewInit(){
    setTimeout(() => {
      //this.basicPanel.open();
      this.isReady = true;
      this.setStep(0);
    }, 100);

    for (const ipType of ['ip4', 'ip6']) {
      const targetPropName = ipType + '_addr';
      for (let i = 0; i < this.formGroup.controls[targetPropName].controls.length; i++) {
        const subipInterfaceField = _.find(_.find(this.basicfieldConfig, {'name': targetPropName}).listFields[i], {'name': ipType + '_interface'});
        subipInterfaceField.options = ipType === 'ip4' ? this.ip4_interfaceField.options : this.ip6_interfaceField.options;
      }
    }
  }

  ngOnInit() {
    this.releaseField = _.find(this.basicfieldConfig, { 'name': 'release' });

    this.ip4_interfaceField = _.find(this.basicfieldConfig, {'name': 'ip4_addr'}).templateListField[0];
    this.ip6_interfaceField = _.find(this.basicfieldConfig, {'name': 'ip6_addr'}).templateListField[0];
    this.vnet_default_interfaceField = _.find(this.networkfieldConfig, {'name': 'vnet_default_interface'});

    this.jailService.getInterfaceChoice().subscribe(
      (res)=>{
        for (const i in res) {
          this.ip4_interfaceField.options.push({ label: res[i], value: res[i]});
          this.ip6_interfaceField.options.push({ label: res[i], value: res[i]});
          this.vnet_default_interfaceField.options.push({ label: res[i], value: res[i]});
        }
      },
      (res)=>{
        new EntityUtils().handleWSError(this, res, this.dialogService);
      }
    );

    this.formFileds = _.concat(this.basicfieldConfig, this.jailfieldConfig, this.networkfieldConfig, this.customConfig, this.rctlConfig);
    this.formGroup = this.entityFormService.createFormGroup(this.formFileds);

    for (const i in this.formFileds) {
      const config = this.formFileds[i];
      if (config.relation.length > 0) {
        this.setRelation(config);
      }
    }

    this.formGroup.controls['dhcp'].valueChanges.subscribe((res) => {
      if (res) {
        this.formGroup.controls['vnet'].setValue(true);
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = true;
        this.formGroup.controls['bpf'].setValue(true);
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).required = true;

        if (!this.formGroup.controls['nat'].disabled) {
          this.setDisabled('nat', true);
        }
      } else {
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = false;
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).required = false;

        if (this.formGroup.controls['nat'].disabled && this.wsResponse.state != 'up') {
          this.setDisabled('nat', false);
        }
      }
    });
    this.formGroup.controls['nat'].valueChanges.subscribe((res) => {
      if (res) {
        this.formGroup.controls['vnet'].setValue(true);
      }
      _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = res;
    });
    this.formGroup.controls['vnet'].valueChanges.subscribe((res) => {
      if (((this.formGroup.controls['dhcp'].value || this.formGroup.controls['nat'].value) || this.formGroup.controls['auto_configure_ip6'].value) && !res) {
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['hasErrors'] = true;
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['errors'] = 'VNET is required.';
      } else {
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['hasErrors'] = false;
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['errors'] = '';
      }

      this.updateInterface(res);
    });
    this.formGroup.controls['bpf'].valueChanges.subscribe((res) => {
      if (this.formGroup.controls['dhcp'].value && !res) {
        _.find(this.basicfieldConfig, { 'name': 'bpf' })['hasErrors'] = true;
        _.find(this.basicfieldConfig, { 'name': 'bpf' })['errors'] = 'BPF is required.';
      } else {
        _.find(this.basicfieldConfig, { 'name': 'bpf' })['hasErrors'] = false;
        _.find(this.basicfieldConfig, { 'name': 'bpf' })['errors'] = '';
      }
    });
    this.formGroup.controls['auto_configure_ip6'].valueChanges.subscribe((res) => {
      let vnet_ctrl = this.formGroup.controls['vnet'];
      if (res) {
        vnet_ctrl.setValue(true);
      } else {
        vnet_ctrl.setValue(vnet_ctrl.value);
      }
      _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = res;
      this.formGroup.controls['ip6_addr'].markAsTouched();
    });
    this.formGroup.controls['ip4_addr'].valueChanges.subscribe((res) => {
      this.updateInterface();
    });
    this.formGroup.controls['ip6_addr'].valueChanges.subscribe((res) => {
      this.updateInterface();
    });

    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
      this.ws.call(this.queryCall, [
        [
          ["host_hostuuid", "=", this.pk]
        ]
      ]).subscribe(
      (res) => {
        this.wsResponse = res[0];
        if (res[0] && res[0].state == 'up') {
          this.save_button_enabled = false;
          this.error = T("Jails cannot be changed while running.");
          for (let i = 0; i < this.formFileds.length; i++) {
            this.setDisabled(this.formFileds[i].name, true);
          }
        } else {
          this.save_button_enabled = true;
          this.error = "";
        }

        for (let i in res[0]) {
          if (i == 'type' && res[0][i] == 'pluginv2') {
            this.setDisabled("host_hostuuid", true);
            this.isPlugin = true;
          }
          if (this.formGroup.controls[i]) {
            if (i == 'ip4_addr' || i == 'ip6_addr') {
              this.deparseIpaddr(res[0][i], i.split('_')[0]);
              continue;
            }

            if (i == 'release') {
              _.find(this.basicfieldConfig, { 'name': 'release' }).options.push({ label: res[0][i], value: res[0][i] });
              this.currentReleaseVersion = Number(_.split(res[0][i], '-')[0]);
            }
            if (_.indexOf(this.TFfields, i) > -1) {
              if (res[0][i] == '1') {
                res[0][i] = true;
              } else {
                res[0][i] = false;
              }
            }
            if (_.indexOf(this.OFfields, i) > -1) {
              if (res[0][i] == 'on') {
                res[0][i] = true;
              } else {
                res[0][i] = false;
              }
            }
            this.formGroup.controls[i].setValue(res[0][i]);
          }
        }
      },
      (res) => {
        new EntityUtils().handleWSError(this, res, this.dialogService);
      });
    });

  }

  deparseIpaddr(value, ipType) {
    value = value.split(',');
    const propName = ipType + '_addr';
    for (let i = 0; i < value.length; i++) {
      if (this.formGroup.controls[propName].controls[i] == undefined) {
        // add controls;
        const templateListField = _.cloneDeep(_.find(this.basicfieldConfig, {'name': propName}).templateListField);
        this.formGroup.controls[propName].push(this.entityFormService.createFormGroup(templateListField));
        _.find(this.basicfieldConfig, {'name': propName}).listFields.push(templateListField);
      }
      if (ipType == 'ip6' && value[i] == 'vnet0|accept_rtadv') {
        this.formGroup.controls['auto_configure_ip6'].setValue(true);
      }

      if (value[i].indexOf('|') > 0) {
        this.formGroup.controls[propName].controls[i].controls[ipType + '_interface'].setValue(value[i].split('|')[0]);
        value[i] = value[i].split('|')[1];
      }
      if (value[i].indexOf('/') > 0) {
        this.formGroup.controls[propName].controls[i].controls[propName].setValue(value[i].split('/')[0]);
        this.formGroup.controls[propName].controls[i].controls[ipType + (ipType == 'ip4' ? '_netmask' : '_prefix')].setValue(value[i].split('/')[1]);
      } else {
        this.formGroup.controls[propName].controls[i].controls[propName].setValue(value[i] == 'none' ? '' : value[i]);
      }
    }
    this.formGroup.controls['dhcp'].setValue(this.wsResponse['dhcp']);
    this.formGroup.controls['nat'].setValue(this.wsResponse['nat']);
  }

  setRelation(config: FieldConfig) {
    const activations =
        this.fieldRelationService.findActivationRelation(config.relation);
    if (activations) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
          activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);

      this.fieldRelationService.getRelatedFormControls(config, this.formGroup)
          .forEach(control => {
            control.valueChanges.subscribe(
                () => { this.relationUpdate(config, activations); });
          });
    }
  }

  setDisabled(name: string, disable: boolean) {
    if (this.formGroup.controls[name]) {
      const method = disable ? 'disable' : 'enable';
      this.formGroup.controls[name][method]();
      return;
    }

    this.formFileds = this.formFileds.map((item) => {
      if (item.name === name) {
        item.disabled = disable;
      }
      return item;
    });
  }

  relationUpdate(config: FieldConfig, activations: any) {
    if (this.save_button_enabled) {
      const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup);
      this.setDisabled(config.name, tobeDisabled);
    }
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  getFullIP(ipInterface: string, ip: string, netmask: string) {
    let full_address = ip;
    if (ipInterface != '') {
      full_address = ipInterface + '|' + ip;
    }
    if (netmask != '') {
      full_address += '/' + netmask;
    }
    return full_address;
  }

  parseIpaddr(value) {
    for (const ipType of ['ip4', 'ip6']) {
      const propName = ipType + '_addr';
      if (value[propName] != undefined) {
        const multi_ipaddr = [];
        for (let i = 0; i < value[propName].length; i++) {
          const subAddr = value[propName][i];
          if (subAddr[propName] != '' && subAddr[propName] != undefined) {
            multi_ipaddr.push(this.getFullIP(subAddr[ipType + '_interface'], subAddr[propName], subAddr[ipType + (ipType == 'ip4' ? '_netmask' : '_prefix')]));
          }
        }
        value[propName] = multi_ipaddr.join(',');
      }
      if (ipType == 'ip6' && this.wsResponse[propName] == "vnet0|accept_rtadv") {
        value[propName] = "none";
      }
      if (value[propName] == '' || value[propName] == undefined) {
        delete value[propName];
      }
    }
  }

  onSubmit() {
    let updateRelease: boolean = false;
    let newRelease: any;
    let value = _.cloneDeep(this.formGroup.value);

    this.parseIpaddr(value);

    if (value['auto_configure_ip6']) {
      value['ip6_addr'] = "vnet0|accept_rtadv";
    }
    delete value['auto_configure_ip6'];

    for (let i in value) {
      // do not send value[i] if value[i] no change
      if (value[i] == this.wsResponse[i]) {
        delete value[i];
      }
      if (value.hasOwnProperty(i)) {
        if (i == 'release') {
          // upgrade release
          updateRelease = true;
          newRelease = value[i];
          delete value[i];
        }
        if (_.indexOf(this.TFfields, i) > -1) {
          if (value[i]) {
            value[i] = '1';
          } else {
            value[i] = '0';
          }
        } else if (_.indexOf(this.OFfields, i) > -1) {
          if (value[i]) {
            value[i] = 'on';
          } else {
            value[i] = 'off';
          }
        }
      }
    }

    if (value['host_hostuuid']) {
      value['name'] = value['host_hostuuid'];
      delete value['host_hostuuid'];
    }

    this.loader.open();

    this.ws.call(this.updateCall, [this.pk, value]).subscribe(
      (res) => {
        this.loader.close();
        if (updateRelease) {
          const option = {
            'release': newRelease,
            'plugin': this.isPlugin,
          }
          const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Upgrading Jail") }, disableClose: true });
          dialogRef.componentInstance.setCall(this.upgradeCall, [this.pk, option]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            this.router.navigate(new Array('/').concat(this.route_success));
          });
        } else {
          this.loader.close();
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
