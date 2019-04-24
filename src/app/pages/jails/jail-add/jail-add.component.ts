import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { T } from '../../../translate-marker'
import { TranslateService } from '@ngx-translate/core'
import { Validators } from '@angular/forms';

import { MatDialog, MatDialogRef } from '@angular/material';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService } from '../../../services/';

import { WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { FieldRelationService } from '../../common/entity/entity-form/services/field-relation.service';
import { EntityUtils } from '../../common/entity/utils';
import { DialogService, NetworkService } from '../../../services';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';
import helptext from '../../../helptext/jails/jails-add';

@Component({
  selector: 'jail-add',
  templateUrl: './jail-add.component.html',
  styleUrls: ['../../common/entity/entity-form/entity-form.component.scss'],
  providers: [JailService, EntityFormService, FieldRelationService, NetworkService]
})
export class JailAddComponent implements OnInit {

  protected addCall = 'jail.create';
  public route_success: string[] = ['jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;

  protected dialogRef: any;
  protected formFileds: FieldConfig[];
  public basicfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'uuid',
      placeholder: helptext.uuid_placeholder,
      tooltip: helptext.uuid_tooltip,
      required: true,
      validation: [ regexValidator(/^[a-zA-Z0-9-_]+$/) ],
      blurStatus: true,
      blurEvent: this.blurEvent,
      parent: this
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
      validation: [ Validators.required ],
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: helptext.dhcp_placeholder,
      tooltip: helptext.dhcp_tooltip,
    },
    {
      type: 'checkbox',
      name: 'vnet',
      placeholder: helptext.vnet_placeholder,
      tooltip: helptext.vnet_tooltip,
    },
    {
      type: 'checkbox',
      name: 'bpf',
      placeholder: helptext.bpf_placeholder,
      tooltip: helptext.bpf_tooltip,
    },
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
      required: false,
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'dhcp',
          value: true,
        }]
      }],
      class: 'inline',
      width: '30%',
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: helptext.ip4_addr_placeholder,
      tooltip: helptext.ip4_addr_tooltip,
      validation : [ regexValidator(this.networkService.ipv4_regex) ],
      relation: [{
      action: 'DISABLE',
      when: [{
        name: 'dhcp',
        value: true,
       }]
      }],
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
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'dhcp',
          value: true,
        }]
      }],
      class: 'inline',
      width: '20%',
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
        },  {
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
      type: 'select',
      name: 'ip6_interface',
      placeholder: helptext.ip6_interface_placeholder,
      tooltip: helptext.ip6_interface_tooltip,
      options: [{
        label: '------',
        value: '',
      }],
      value: '',
      required: false,
      class: 'inline',
      width: '30%',
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'auto_configure_ip6',
          value: true,
        }]
      }]
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: helptext.ip6_addr_placeholder,
      tooltip: helptext.ip6_addr_tooltip,
      validation : [ regexValidator(this.networkService.ipv6_regex) ],
      class: 'inline',
      width: '50%',
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'auto_configure_ip6',
          value: true,
        }]
      }]
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
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'auto_configure_ip6',
          value: true,
        }]
      }]
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
  ];
  public jailfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'devfs_ruleset',
      placeholder: helptext.devfs_ruleset_placeholder,
      tooltip: helptext.devfs_ruleset_tooltip,
    },
    {
      type: 'input',
      name: 'exec_start',
      placeholder: helptext.exec_start_placeholder,
      tooltip: helptext.exec_start_tooltip,
    },
    {
      type: 'input',
      name: 'exec_stop',
      placeholder: helptext.exec_stop_placeholder,
      tooltip: helptext.exec_stop_tooltip,
    },
    {
      type: 'input',
      name: 'exec_prestart',
      placeholder: helptext.exec_prestart_placeholder,
      tooltip: helptext.exec_prestart_tooltip,
    },
    {
      type: 'input',
      name: 'exec_poststart',
      placeholder: helptext.exec_poststart_placeholder,
      tooltip: helptext.exec_poststart_tooltip,
    }, {
      type: 'input',
      name: 'exec_prestop',
      placeholder: helptext.exec_prestop_placeholder,
      tooltip: helptext.exec_prestop_tooltip,
    }, {
      type: 'input',
      name: 'exec_poststop',
      placeholder: helptext.exec_poststop_placeholder,
      tooltip: helptext.exec_poststop_tooltip,
    }, {
      type: 'checkbox',
      name: 'exec_clean',
      placeholder: helptext.exec_clean_placeholder,
      tooltip: helptext.exec_clean_tooltip,
    },
    {
      type: 'input',
      name: 'exec_timeout',
      placeholder: helptext.exec_timeout_placeholder,
      tooltip: helptext.exec_timeout_tooltip,
    }, {
      type: 'input',
      name: 'stop_timeout',
      placeholder: helptext.stop_timeout_placeholder,
      tooltip: helptext.stop_timeout_tooltip,
    }, {
      type: 'input',
      name: 'exec_jail_user',
      placeholder: helptext.exec_jail_user_placeholder,
      tooltip: helptext.exec_jail_user_tooltip,
    }, {
      type: 'input',
      name: 'exec_system_jail_user',
      placeholder: helptext.exec_system_jail_user_placeholder,
      tooltip: helptext.exec_system_jail_user_tooltip,
    },
    {
      type: 'input',
      name: 'exec_system_user',
      placeholder: helptext.exec_system_user_placeholder,
      tooltip: helptext.exec_system_user_tooltip,
    },
    {
      type: 'checkbox',
      name: 'mount_devfs',
      placeholder: helptext.mount_devfs_placeholder,
      tooltip: helptext.mount_devfs_tooltip,
    },
    {
      type: 'checkbox',
      name: 'mount_fdescfs',
      placeholder: helptext.mount_fdescfs_placeholder,
      tooltip: helptext.mount_fdescfs_tooltip,
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
      }]
    },
    {
      type: 'input',
      name: 'children_max',
      placeholder: helptext.children_max_placeholder,
      tooltip: helptext.children_max_tooltip,
    },
    {
      type: 'input',
      name: 'login_flags',
      placeholder: helptext.login_flags_placeholder,
      tooltip: helptext.login_flags_tooltip,
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
      }]
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
      }]
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
      }]
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
      name: 'allow_mount',
      placeholder: helptext.allow_mount_placeholder,
      tooltip: helptext.allow_mount_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_devfs',
      placeholder: helptext.allow_mount_devfs_placeholder,
      tooltip: helptext.allow_mount_devfs_tooltip,
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
    },
    {
      type: 'checkbox',
      name: 'allow_mount_procfs',
      placeholder: helptext.allow_mount_procfs_placeholder,
      tooltip: helptext.allow_mount_procfs_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_tmpfs',
      placeholder: helptext.allow_mount_tmpfs_placeholder,
      tooltip: helptext.allow_mount_tmpfs_tooltip,
    },
    {
      type: 'checkbox',
      name: 'allow_mount_zfs',
      placeholder: helptext.allow_mount_zfs_placeholder,
      tooltip: helptext.allow_mount_zfs_tooltip,
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
      type: 'input',
      name: 'vnet_interfaces',
      placeholder: helptext.vnet_interfaces_placeholder,
      tooltip: helptext.vnet_interfaces_tooltip,
    }
  ];
  public networkfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'interfaces',
      placeholder: helptext.interfaces_placeholder,
      tooltip: helptext.interfaces_tooltip,
    },
    {
      type: 'input',
      name: 'host_domainname',
      placeholder: helptext.host_domainname_placeholder,
      tooltip: helptext.host_domainname_tooltip,
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: helptext.host_hostname_placeholder,
      tooltip: helptext.host_hostname_tooltip,
    },
    {
      type: 'input',
      name: 'exec_fib',
      placeholder: helptext.exec_fib_placeholder,
      tooltip: helptext.exec_fib_tooltip,
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
      }]
    },
    {
      type: 'checkbox',
      name: 'ip6_saddrsel',
      placeholder: helptext.ip6_saddrsel_placeholder,
      tooltip: helptext.ip6_saddrsel_tooltip,
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
      }]
    },
    {
      type: 'input',
      name: 'resolver',
      placeholder: helptext.resolver_placeholder,
      tooltip: helptext.resolver_tooltip,
    },
    {
      type: 'input',
      name: 'mac_prefix',
      placeholder: helptext.mac_prefix_placeholder,
      tooltip: helptext.mac_prefix_tooltip,
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
      ]
    },
    {
      type: 'input',
      name: 'vnet0_mac',
      placeholder: helptext.vnet0_mac_placeholder,
      tooltip: helptext.vnet0_mac_tooltip,
    },
    {
      type: 'input',
      name: 'vnet1_mac',
      placeholder: helptext.vnet1_mac_placeholder,
      tooltip: helptext.vnet1_mac_tooltip,
    },
    {
      type: 'input',
      name: 'vnet2_mac',
      placeholder: helptext.vnet2_mac_placeholder,
      tooltip: helptext.vnet2_mac_tooltip,
    },
    {
      type: 'input',
      name: 'vnet3_mac',
      placeholder: helptext.vnet3_mac_placeholder,
      tooltip: helptext.vnet3_mac_tooltip,
    },
  ];
  public customConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'owner',
      placeholder: helptext.owner_placeholder,
      tooltip: helptext.owner_tooltip,
    },
    {
      type: 'input',
      name: 'priority',
      placeholder: helptext.priority_placeholder,
      tooltip: helptext.priority_tooltip,
    },
    {
      type: 'input',
      name: 'hostid',
      placeholder: helptext.hostid_placeholder,
      tooltip: helptext.hostid_tooltip,
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
    },
    {
      type: 'input',
      name: 'depends',
      placeholder: helptext.depends_placeholder,
      tooltip: helptext.depends_tooltip,
    },
    {
      type: 'checkbox',
      name: 'mount_procfs',
      placeholder: helptext.mount_procfs_placeholder,
      tooltip: helptext.mount_procfs_tooltip,
    },
    {
      type: 'checkbox',
      name: 'mount_linprocfs',
      placeholder: helptext.mount_linprocfs_placeholder,
      tooltip: helptext.mount_linprocfs_tooltip,
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
    },
    {
      type: 'input',
      name: 'jail_zfs_mountpoint',
      placeholder: helptext.jail_zfs_mountpoint_placeholder,
      tooltip: helptext.jail_zfs_mountpoint_tooltip,
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
    {
      type: 'checkbox',
      name: 'nat',
      placeholder: helptext.nat_placeholder,
      tooltip: helptext.nat_tooltip,
    },
  ];
  public rctlConfig: FieldConfig[] = [

 //    {
 //      type: 'input',
 //      name: 'memoryuse',
 //      placeholder: helptext.memoryuse_placeholder,
 //      tooltip: helptext.memoryuse_tooltip,
 //    },
 //    {
 //      type: 'input',
 //      name: 'pcpu',
 //      placeholder: helptext.pcpu_placeholder,
 //      tooltip: helptext.pcpu_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'cpuset',
 //      placeholder: helptext.cpuset_placeholder,
 //      tooltip: helptext.cpuset_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'rlimits',
 //      placeholder: helptext.rlimits_placeholder,
 //      tooltip: helptext.rlimits_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'memorylocked',
 //      placeholder: helptext.memorylocked_placeholder,
 //      tooltip: helptext.memorylocked_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'vmemoryuse',
 //      placeholder: helptext.vmemoryuse_placeholder,
 //      tooltip: helptext.vmemoryuse_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'maxproc',
 //      placeholder: helptext.maxproc_placeholder,
 //      tooltip: helptext.maxproc_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'cputime',
 //      placeholder: helptext.cputime_placeholder,
 //      tooltip: helptext.cputime_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'datasize',
 //      placeholder: helptext.datasize_placeholder,
 //      tooltip: helptext.datasize_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'stacksize',
 //      placeholder: helptext.stacksize_placeholder,
 //      tooltip: helptext.stacksize_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'coredumpsize',
 //      placeholder: helptext.coredumpsize_placeholder,
 //      tooltip: helptext.coredumpsize_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'openfiles',
 //      placeholder: helptext.openfiles_placeholder,
 //      tooltip: helptext.openfiles_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'pseudoterminals',
 //      placeholder: helptext.pseudoterminals_placeholder,
 //      tooltip: helptext.pseudoterminals_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'swapuse',
 //      placeholder: helptext.swapuse_placeholder,
 //      tooltip: helptext.swapuse_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nthr',
 //      placeholder: helptext.nthr_placeholder,
 //      tooltip: helptext.nthr_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'msgqqueued',
 //      placeholder: helptext.msgqqueued_placeholder,
 //      tooltip: helptext.msgqqueued_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'msgqsize',
 //      placeholder: helptext.msgqsize_placeholder,
 //      tooltip: helptext.msgqsize_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nmsgq',
 //      placeholder: helptext.nmsgq_placeholder,
 //      tooltip: helptext.nmsgq_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nsemop',
 //      placeholder: helptext.nsemop_placeholder,
 //      tooltip: helptext.nsemop_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nshm',
 //      placeholder: helptext.nshm_placeholder,
 //      tooltip: helptext.nshm_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'shmsize',
 //      placeholder: helptext.shmsize_placeholder,
 //      tooltip: helptext.shmsize_tooltip,
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'wallclock',
 //      placeholder: helptext.wallclock_placeholder,
 //      tooltip: helptext.wallclock_tooltip,
 //    },
  ];

  protected releaseField: any;
  public step: any = 0;

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

  protected currentServerVersion: any;
  protected ip4_interfaceField: any;
  protected ip4_netmaskField: any;
  protected ip6_interfaceField: any;
  protected ip6_prefixField: any;
  protected vnet_default_interfaceField:any;
  protected template_list: string[];

  constructor(protected router: Router,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected networkService: NetworkService) {}

  updateInterfaceValidation() {
    let dhcp_ctrl = this.formGroup.controls['dhcp'];
    let vnet_ctrl = this.formGroup.controls['vnet'];
    let ip4_addr_ctrl = this.formGroup.controls['ip4_addr'];
    let ip6_addr_ctrl = this.formGroup.controls['ip6_addr'];

    if (dhcp_ctrl.value != true && vnet_ctrl.value == true && ip4_addr_ctrl.value != undefined && ip4_addr_ctrl.value != '') {
      this.ip4_interfaceField.required = true;
      this.formGroup.controls['ip4_interface'].setValidators([Validators.required]);
      this.formGroup.controls['ip4_interface'].updateValueAndValidity();
    } else {
      this.ip4_interfaceField.required = false;
      this.formGroup.controls['ip4_interface'].clearValidators();
      this.formGroup.controls['ip4_interface'].updateValueAndValidity();
    }

    if (dhcp_ctrl.value != true && vnet_ctrl.value == true && ip6_addr_ctrl.value != undefined && ip6_addr_ctrl.value != '') {
      this.ip6_interfaceField.required = true;
      this.formGroup.controls['ip6_interface'].setValidators([Validators.required]);
      this.formGroup.controls['ip6_interface'].updateValueAndValidity();
    } else {
      this.ip6_interfaceField.required = false;
      this.formGroup.controls['ip6_interface'].clearValidators();
      this.formGroup.controls['ip6_interface'].updateValueAndValidity();
    }
  }

  ngOnInit() {
    this.releaseField = _.find(this.basicfieldConfig, { 'name': 'release' });
    this.template_list = new Array<string>();
    // get jail templates as release options
    this.ws.call('jail.list_resource', ["TEMPLATE"]).subscribe(
      (res) => {
        for (const i in res) {
          this.template_list.push(res[i][1]);
          this.releaseField.options.push({ label: res[i][1] + '(template)', value: res[i][1] });
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialogService);
      }
    )

    this.ws.call('system.info').subscribe((res) => {
      this.currentServerVersion = Number(_.split(res.version, '-')[1]);
      this.jailService.getLocalReleaseChoices().subscribe(
        (res_local) => {
          for (let j in res_local) {
            let rlVersion = Number(_.split(res_local[j], '-')[0]);
            if (this.currentServerVersion >= Math.floor(rlVersion)) {
              this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
            }
          }
          this.jailService.getRemoteReleaseChoices().subscribe(
            (res_remote) => {
              for (let i in res_remote) {
                if (_.indexOf(res_local, res_remote[i]) < 0) {
                  let rmVersion = Number(_.split(res_remote[i], '-')[0]);
                  if (this.currentServerVersion >= Math.floor(rmVersion)) {
                    this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
                  }
                }
              }
            },
            (res_remote) => {
              this.dialogService.errorReport(T('Error: Fetching remote release choices failed.'), res_remote.reason, res_remote.trace.formatted);
            });
        },
        (res_local) => {
          this.dialogService.errorReport(T('Error: Displaying local fetched releases failed.'), res_local.reason, res_local.trace.formatted);
        });
    },
    (res) => {
      new EntityUtils().handleWSError(this, res, this.dialogService);
    });

    this.ip4_interfaceField = _.find(this.basicfieldConfig, {'name': 'ip4_interface'});
    this.ip4_netmaskField = _.find(this.basicfieldConfig, {'name': 'ip4_netmask'});
    this.ip6_interfaceField = _.find(this.basicfieldConfig, {'name': 'ip6_interface'});
    this.ip6_prefixField = _.find(this.basicfieldConfig, {'name': 'ip6_prefix'});
    this.vnet_default_interfaceField = _.find(this.networkfieldConfig, {'name': 'vnet_default_interface'});

    // get interface options
    this.ws.call('interfaces.query', [[["name", "rnin", "vnet0:"]]]).subscribe(
      (res)=>{
        for (let i in res) {
          this.ip4_interfaceField.options.push({ label: res[i].name, value: res[i].name});
          this.ip6_interfaceField.options.push({ label: res[i].name, value: res[i].name});
          this.vnet_default_interfaceField.options.push({ label: res[i].name, value: res[i].name});
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
      } else {
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).required = false;
         _.find(this.basicfieldConfig, { 'name': 'bpf' }).required = false;
      }
    });
    this.formGroup.controls['vnet'].valueChanges.subscribe((res) => {
      if (res) {
        if (_.find(this.ip4_interfaceField.options, { 'label': 'vnet0'}) == undefined) {
          this.ip4_interfaceField.options.push({ label: 'vnet0', value: 'vnet0'});
        }
        if (_.find(this.ip6_interfaceField.options, { 'label': 'vnet0'}) == undefined) {
          this.ip6_interfaceField.options.push({ label: 'vnet0', value: 'vnet0'});
        }
      } else {
        if (_.find(this.ip4_interfaceField.options, { 'label': 'vnet0'}) != undefined) {
          this.ip4_interfaceField.options.pop({ label: 'vnet0', value: 'vnet0'});
        }
        if (_.find(this.ip6_interfaceField.options, { 'label': 'vnet0'}) != undefined) {
          this.ip6_interfaceField.options.pop({ label: 'vnet0', value: 'vnet0'});
        }
      }

      if ((this.formGroup.controls['dhcp'].value || this.formGroup.controls['auto_configure_ip6'].value) && !res) {
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['hasErrors'] = true;
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['errors'] = 'VNET is required.';
      } else {
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['hasErrors'] = false;
        _.find(this.basicfieldConfig, { 'name': 'vnet' })['errors'] = '';
      }
      this.updateInterfaceValidation();
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
    });
    this.formGroup.controls['ip4_addr'].valueChanges.subscribe((res) => {
      this.updateInterfaceValidation();
    });
    this.formGroup.controls['ip6_addr'].valueChanges.subscribe((res) => {
      this.updateInterfaceValidation();
    });

    this.ws.call("jail.query", [
      [
        ["host_hostuuid", "=", "default"]
      ]
    ]).subscribe(
    (res) => {
      for (let i in res[0]) {
        if (this.formGroup.controls[i]) {
          if ((i == 'ip4_addr' || i == 'ip6_addr') && res[0][i] == 'none') {
            this.formGroup.controls[i].setValue('');
            continue;
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
      new EntityUtils().handleError(this, res);
    });
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
    const tobeDisabled = this.fieldRelationService.isFormControlToBeDisabled(
        activations, this.formGroup);
    this.setDisabled(config.name, tobeDisabled);
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

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    const property: any = [];
    const value = _.cloneDeep(this.formGroup.value);

    if (value['jailtype'] === 'basejail') {
      value['basejail'] = true;
    }
    delete value['jailtype'];

    if (value['ip4_addr'] == '' || value['ip4_addr'] == undefined) {
      delete value['ip4_addr'];
    } else {
      value['ip4_addr'] = this.getFullIP(value['ip4_interface'], value['ip4_addr'], value['ip4_netmask']);
    }
    delete value['ip4_interface'];
    delete value['ip4_netmask'];
    if (value['ip6_addr'] == '' || value['ip6_addr'] == undefined) {
      delete value['ip6_addr'];
    } else {
      value['ip6_addr'] = this.getFullIP(value['ip6_interface'], value['ip6_addr'], value['ip6_prefix']);
    }
    delete value['ip6_interface'];
    delete value['ip6_prefix'];

    if (value['auto_configure_ip6']) {
      value['ip6_addr'] = "vnet0|accept_rtadv";
    }
    delete value['auto_configure_ip6'];

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] == undefined) {
          delete value[i];
        } else {
          if (_.indexOf(this.TFfields, i) > -1) {
            if (value[i]) {
              property.push(i + '=1');
            } else {
              property.push(i + '=0');
            }
            delete value[i];
          } else if (_.indexOf(this.OFfields, i) > -1) {
            if (value[i]) {
                property.push(i + '=on');
              } else {
                property.push(i + '=off');
              }
              delete value[i];
          } else {
            if (i != 'uuid' && i != 'release' && i != 'basejail') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    if (_.indexOf(this.template_list, value['release']) > -1) {
      value['template'] = value['release'];
    }

    this.dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Creating Jail") }, disableClose: true });
    this.dialogRef.componentInstance.setDescription(T("Creating Jail..."));
    this.dialogRef.componentInstance.setCall(this.addCall, [value]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe((res) => {
      this.dialogRef.close(true);
      this.router.navigate(new Array('/').concat(this.route_success));
    });
    this.dialogRef.componentInstance.failure.subscribe((res) => {
      this.dialogRef.close();
      // show error inline if error is EINVAL
      if (res.error.indexOf('[EINVAL]') > -1) {
        res.error = res.error.substring(9).split(':');
        const field = res.error[0];
        const error = res.error[1];
        const fc = _.find(this.formFileds, {'name' : field});
        if (fc && !fc['isHidden']) {
          fc['hasErrors'] = true;
          fc['errors'] = error;
        }
      } else {
        new EntityUtils().handleWSError(this, res, this.dialogService);
      }
    });
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
  blurEvent(parent){
    
    const jail_name = parent.formGroup.value.uuid;
    parent.ws.call('jail.query', [[["id","=",jail_name]]]).subscribe((jail_wizard_res)=>{
      if(jail_wizard_res.length > 0){
        _.find(parent.formFileds, {'name' : 'uuid'})['hasErrors'] = true;
        _.find(parent.formFileds, {'name' : 'uuid'})['errors'] = `Jail ${jail_wizard_res[0].id} already exists.`;
        parent.formGroup.controls.uuid.setValue("");
  
      } else {
        _.find(parent.formFileds, {'name' : 'uuid'})['hasErrors'] = false;
        _.find(parent.formFileds, {'name' : 'uuid'})['errors'] = '';

      }
    })
  }
}
