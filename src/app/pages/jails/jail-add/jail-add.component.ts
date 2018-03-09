import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { JailService } from '../../../services/';

import { WebSocketService } from '../../../services/';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';

import { EntityFormComponent } from '../../common/entity/entity-form';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { EntityFormService } from '../../common/entity/entity-form/services/entity-form.service';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'jail-add',
  templateUrl: './jail-add.component.html',
  providers: [JailService, EntityFormService]
})
export class JailAddComponent implements OnInit {

  protected addCall = 'jail.create';
  public route_success: string[] = ['jails'];
  protected route_conf: string[] = ['jails', 'configuration'];

  public formGroup: any;
  public error: string;
  public busy: Subscription;

  protected formFileds: FieldConfig[];
  public basicfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'uuid',
      placeholder: 'Jails Name',
      tooltip : 'Mandatory. Can only contain letters, numbers, dashes,\
 or the underscore character.',
    },
    {
      type: 'select',
      name: 'release',
      placeholder: 'Release',
      tooltip : 'Select the FreeBSD release for the jail.',
      options: [],
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: 'IPv4 Address',
      tooltip : 'This and the other IPv4 settings are grayed out if\
 <b>IPv4 DHCP</b> is checked. Enter a unique IP address that is in the\
 local network and not already used by any other computer.',
    },
    {
      type: 'input',
      name: 'defaultrouter',
      placeholder: 'Default IPv4 Router',
      tooltip:'Setting this property to anything other than <i>none</i>\
 configures a default route inside a <b>VNET</b> jail.',
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: 'IPv6 Address',
      tooltip : 'This and other IPv6 settings are grayed out if\
 <b>IPv6 Autoconfigure</b> is checked; enter a unique IPv6 address that\
 is in the local network and not already used by any other computer',
    },
    {
      type: 'input',
      name: 'defaultrouter6',
      placeholder: 'Default IPv6 Router',
      tooltip:'Setting this property to anything other than <i>none</i>\
 configures a default IPv6 route inside a <b>VNET</b> jail.',
    },
    {
      type: 'input',
      name: 'notes',
      placeholder: 'Note',
      tooltip: 'Optional. Add any notes about the jail here.',
    },
    {
      type: 'checkbox',
      name: 'vnet',
      placeholder: 'Vnet',
      tooltip: 'Check to start the jail with a VNET or\
 shared IP configuration. Check this if a fully virtualized per-jail\
 network stack is required.',
    }
  ];
  public jailfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'devfs_ruleset',
      placeholder: 'devfs_ruleset',
      tooltip: 'Enter the number of the <b>devfs</b> ruleset that is\
 enforced for mounting <b>devfs</b> in this jail. A value of <i>0</i>\
 (default) means no ruleset is enforced. Mounting <b>devfs</b> inside\
 a jail is possible only if the <b>allow_mount</b> and\
 <b>allow_mount_devfs</b> permissions are effective and\
 <b>enforce_statfs</b> is set to a value lower than <i>2</i>.',
    },
    {
      type: 'input',
      name: 'exec_start',
      placeholder: 'exec_start',
      tooltip: 'Commands to run in the prison environment when a jail is\
 created. Example: <b>sh /etc/rc</b>. See <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=jail&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">jail(8)</a> for more details.',
    },
    {
      type: 'input',
      name: 'exec_stop',
      placeholder: 'exec_stop',
      tooltip: 'Commands to run in the prison environment before a jail\
 is removed and after any <b>exec_prestop</b> commands have completed.\
 Example: <i>sh /etc/rc.shutdown</i>.',
    },
    {
      type: 'input',
      name: 'exec_prestart',
      placeholder: 'exec_prestart',
      tooltip: 'List any commands to run in the system environment\
 before a jail is started.',
    },
    {
      type: 'input',
      name: 'exec_poststart',
      placeholder: 'exec_poststart',
      tooltip: 'List any commands to run in the system environment after\
 a jail is started and after any <b>exec_start</b> commands are finished.',
    }, {
      type: 'input',
      name: 'exec_prestop',
      placeholder: 'exec_prestop',
      tooltip: 'List any commands to run in the system environment\
 before a jail is stopped.',
    }, {
      type: 'input',
      name: 'exec_poststop',
      placeholder: 'exec_poststop',
      tooltip: 'List any commands to run in the system environment after\
 a jail is stopped.',
    }, {
      type: 'checkbox',
      name: 'exec_clean',
      placeholder: 'exec_clean',
      tooltip: 'Run commands in a clean environment. The current\
 environment is discarded except for HOME, SHELL, TERM and USER. HOME\
 and SHELL are set to the target login default values. USER is set to\
 the target login. TERM is imported from the current environment. The\
 environment variables from the login class capability database for the\
 target login are also set.',
    }, {
      type: 'input',
      name: 'exec_timeout',
      placeholder: 'exec_timeout',
      tooltip: 'Define the maximum amount of time in seconds to wait for\
 a command to complete. If a command is still running after the allotted\
 time, the jail will be terminated.',
    }, {
      type: 'input',
      name: 'stop_timeout',
      placeholder: 'stop_timeout',
      tooltip: 'Define the maximum amount of time in seconds to wait for\
 the jail processes to exit after sending a SIGTERM signal. This happens\
 after any <b>exec_stop</b> commands are complete. After the defined time,\
 the jail is removed, killing any remaining processes. If this is set to\
 <i>0</i>, no SIGTERM is sent and the jail is immediately removed.',
    }, {
      type: 'input',
      name: 'exec_jail_user',
      placeholder: 'exec_jail_user',
      tooltip: 'Enter either <i>root</i> or a valid <i>username</i>. In\
 the jail environment, commands run as this defined user.',
    }, {
      type: 'input',
      name: 'exec_system_jail_user',
      placeholder: 'exec_system_jail_user',
      tooltip: 'This boolean option looks for the <b>exec_jail_user</b>\
 in the system <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=passwd&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">passwd(5)</a> file instead of the file from the jail.',
    }, {
      type: 'input',
      name: 'exec_system_user',
      placeholder: 'exec_system_user',
      tooltip: 'Define either <i>root</i> or an existing <i>username</i>.\
 Commands are run as this user in the system environment.',
    }, {
      type: 'checkbox',
      name: 'mount_devfs',
      placeholder: 'mount_devfs',
      tooltip: 'Mount a <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=devfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">devfs(5)</a> filesystem on the chrooted <ins>/dev</ins>\
 directory and apply the ruleset in the <b>devfs_ruleset</b> parameter\
 to restrict the devices visible inside the jail.',
    }, {
      type: 'checkbox',
      name: 'mount_fdescfs',
      placeholder: 'mount_fdescfs',
      tooltip: 'Mount an <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=fdescfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">fdescfs(5)</a> filesystem in the jail <ins>/dev/fd</ins>\
 directory.',
    }, {
      //"enforce_statfs": ("0", "1", "2"),
      type: 'select',
      name: 'enforce_statfs',
      placeholder: 'enforce_statfs',
      tooltip: 'Determine which information processes in a jail are able\
 to obtain about mount points.  The behavior of multiple syscalls is\
 affected. <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">statfs(2)</a>, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">fstatfs(2)</a>, <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=getfsstat&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">getfsstat(2)</a>, and <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=fhstatfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">fhstatfs(2)</a> and other similar compatibility syscalls.\
 <br>When set to <i>0</i>, all mount points are available without any\
 restrictions.  When set to <i>1</i>, only mount points below the jail\
 chroot directory are visible. When set to <i>2</i>, the syscalls above\
 can operate only on a mountpoint where the jail chroot directory is\
 located.',
      options: [{
        label: 'O',
        value: '0',
      }, {
        label: '1',
        value: '1',
      }, {
        label: '2',
        value: '2',
      }]
    }, {
      type: 'input',
      name: 'children_max',
      placeholder: 'children_max',
      tooltip: 'Enter the number of child jails allowed to be created by\
 this jail (or by other jails under this jail). This limit is <i>0</i> by\
 default, indicating the jail is not allowed to create child jails.',
    }, {
      type: 'input',
      name: 'login_flags',
      placeholder: 'login_flags',
      tooltip: 'List any flags to be passed to <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=login&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_">login(1)</a> when logging in to jails with the <b>console</b>\
 function.',
    }, {
      type: 'input',
      name: 'securelevel',
      placeholder: 'securelevel',
      tooltip: 'Options are <i>3</i>, <i>2</i>, <i>1</i>, <i>0</i>, and\
 <i>-1</i>. Enter a value for the <b>kernsecurelevel</b> sysctl of the\
 jail. A jail is only allowed to have a higher securelevel than the\
 default system.',
    }, {
      type: 'select',
      name: 'sysvmsg',
      placeholder: 'sysvmsg',
      tooltip: 'Allow access to SYSV IPC message primitives. When set to\
 <i>inherit</i>, all IPC objects on the system are visible to this jail.\
 When set to <i>new</i>, the jail has its own key namespace and can only\
 see the objects it has created. The system or parent jail has access to\
 the jail objects, but not its keys.  When set to <i>disable</i>, the\
 jail cannot perform any <b>sysvmsg</b> related system calls.',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'select',
      name: 'sysvsem',
      placeholder: 'sysvsem',
      tooltip: 'Allow access to SYSV IPC semaphore primitives in the same\
 manner as <b>sysvmsg</b>.',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'select',
      name: 'sysvshm',
      placeholder: 'sysvshm',
      tooltip: 'Allow access to SYSV IPC shared memory primitives in the\
 same manner as <b>sysvmsg</b>.',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'disable',
        value: 'disable',
      }]
    }, {
      type: 'checkbox',
      name: 'allow_set_hostname',
      placeholder: 'allow_set_hostname',
      tooltip: 'Allow the jail hostname to be changed with <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=hostname&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">hostname(1)</a> or <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=sethostname&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">sethostname(3)</a>.',
    }, {
      type: 'checkbox',
      name: 'allow_sysvipc',
      placeholder: 'allow_sysvipc',
      tooltip: 'In FreeBSD 11.0 and later, this setting is deprecated.\
 Use <b>sysvmsg</b>, <b>sysvsem</b>, and <b>sysvshm</b> instead. Choose\
 if a process in the jail has access to System V IPC primitives.',
    }, {
      type: 'checkbox',
      name: 'allow_raw_sockets',
      placeholder: 'allow_raw_sockets',
      tooltip: 'Select this to allow utilities like <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ping&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">ping(8)</a> and <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=traceroute&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">traceroute(8)</a> to operate inside the jail. When\
 checked, the source IP addresses are enforced to comply with the IP\
 address bound to the jail, ignoring the the IP_HDRINCL flag on the\
 socket.',
    }, {
      type: 'checkbox',
      name: 'allow_chflags',
      placeholder: 'allow_chflags',
      tooltip: 'Check this to treat jail users as privileged and allowed\
 to manipulate system file flags subject to the usual constraints on\
 <b>kern.securelevel</b>.',
    }, {
      type: 'checkbox',
      name: 'allow_mount',
      placeholder: 'allow_mount',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount filesystem types marked as jail-friendly.',
    }, {
      type: 'checkbox',
      name: 'allow_mount_devfs',
      placeholder: 'allow_mount_devfs',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount the devfs file system. This permission is effective only\
 together with <b>allow_mount</b> and if <b>enforce_statfs</b> is set to\
 a value lower than <i>2</i>.',
    }, {
      type: 'checkbox',
      name: 'allow_mount_nullfs',
      placeholder: 'allow_mount_nullfs',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount the nullfs file system. This permission is effective only\
 together with <b>allow_mount</b> and if <b>enforce_statfs</b> is set to\
 a value lower than <i>2</i>.',
    }, {
      type: 'checkbox',
      name: 'allow_mount_procfs',
      placeholder: 'allow_mount_procfs',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount the procfs file system. This permission is effective only\
 together with <b>allow_mount</b> and if <b>enforce_statfs</b> is set to\
 a value lower than <i>2</i>.',
    }, {
      type: 'checkbox',
      name: 'allow_mount_tmpfs',
      placeholder: 'allow_mount_tmpfs',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount the tmpfs file system. This permission is effective only\
 together with <b>allow_mount</b> and if <b>enforce_statfs</b> is set to\
 a value lower than <i>2</i>.',
    }, {
      type: 'checkbox',
      name: 'allow_mount_zfs',
      placeholder: 'allow_mount_zfs',
      tooltip: 'Check to allow privileged users inside the jail to mount\
 and unmount the ZFS file system. This permission is effective only\
 together with <b>allow_mount</b> and if <b>enforce_statfs</b> is set to\
 a value lower than <i>2</i>.',
    }, {
      type: 'checkbox',
      name: 'allow_quotas',
      placeholder: 'allow_quotas',
      tooltip: 'Check to allow the jail root to administer quotas on the\
 jail filesystems. This includes filesystems the jail may share with\
 other jails or with non-jailed parts of the system.',
    }, {
      type: 'checkbox',
      name: 'allow_socket_af',
      placeholder: 'allow_socket_af',
      tooltip: 'Check to allow access to other protocol stacks beyond\
 IPv4, IPv6, local (UNIX), and route. <b>Warning:</b> jail functionality\
 may not exist for other protocal stacks.',
    }
  ];
  public networkfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'interfaces',
      placeholder: 'interfaces',
      tooltip: 'List up to four interface configurations in the format\
 <i>interface:bridge</i>, separated by a comma (,). The left value is\
 the virtual VNET interface name and the right value is the bridge name\
 where the virtual interface should be attached.',
    },
    {
      type: 'input',
      name: 'host_domainname',
      placeholder: 'host_domainname',
      tooltip: 'Enter a <a\
 href="https://www.freebsd.org/doc/handbook/network-nis.html"\
 target="_blank">NIS Domain name</a> for the jail.',
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: 'host_hostname',
      tooltip: 'Enter a hostname for the jail. By default, the system\
 uses the jail UUID.',
    },
    {
      type: 'input',
      name: 'exec_fib',
      placeholder: 'exec_fib',
      tooltip: 'Enter a number to define the routing table (FIB) to set\
 when running commands inside the jail.',
    },
    {
      type: 'checkbox',
      name: 'ip4_saddrsel',
      placeholder: 'ip4_saddrsel',
      tooltip: 'This is only availabled when the jail is not configured\
 to use VNET. Disables IPv4 source address selection for the prison in\
 favor of the primary IPv4 address of the jail.',
    },
    {
      type: 'select',
      name: 'ip4',
      placeholder: 'ip4',
      tooltip: 'This setting controls the availability of\
 IPv4 addresses. Possible values are <i>inherit</i> to allow\
 unrestricted access to all system addresses, <i>new</i> to\
 restrict addresses with <b>ip4_addr</b>, and <i>disable</i> to\
 stop the jail from using IPv4 entirely.',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'None',
        value: 'none',
      }]
    },
    {
      type: 'checkbox',
      name: 'ip6_saddrsel',
      placeholder: 'ip6_saddrsel',
      tooltip: 'Check to disables IPv6 source address selection for the\
 prison in favor of the primary IPv6 address of the jail.',
    },
    {
      type: 'select',
      name: 'ip6',
      placeholder: 'ip6',
      tooltip: 'This setting controls the availability of\
 IPv6 addresses. Possible values are <i>inherit</i> to allow\
 unrestricted access to all system addresses, <i>new</i> to\
 restrict addresses with <b>ip4_addr</b>, and <i>disable</i> to\
 stop the jail from using IPv6 entirely.',
      options: [{
        label: 'New',
        value: 'new',
      }, {
        label: 'Inherit',
        value: 'inherit',
      }, {
        label: 'None',
        value: 'none',
      }]
    },
    {
      type: 'input',
      name: 'resolver',
      placeholder: 'resolver',
      tooltip: 'Add lines to the jail <ins>resolv.conf</ins> file.\
 <b>Example:</b> <i>nameserver IP;search domain.local</i>. Fields must\
 be delimited with a semicolon (;), which are translated as new lines in\
 <ins>resolv.conf</ins>. Enter <i>none</i> to inherit the\
 <ins>resolv.conf</ins> file from the host.',
    },
    {
      type: 'input',
      name: 'mac_prefix',
      placeholder: 'mac_prefix',
      tooltip: 'Optional. Enter a valid MAC address vendor prefix.\
 <b>Example:</b> <i>E4F4C6</i>',
    },
    {
      type: 'input',
      name: 'vnet0_mac',
      placeholder: 'vnet0_mac',
      tooltip: 'Optional. Enter a valid MAC address for this VNET\
 interface.',
    },
    {
      type: 'input',
      name: 'vnet1_mac',
      placeholder: 'vnet1_mac',
      tooltip: 'Optional. Enter a valid MAC address for this VNET\
 interface.',
    },
    {
      type: 'input',
      name: 'vnet2_mac',
      placeholder: 'vnet2_mac',
      tooltip: 'Optional. Enter a valid MAC address for this VNET\
 interface.',
    },
    {
      type: 'input',
      name: 'vnet3_mac',
      placeholder: 'vnet3_mac',
      tooltip: 'Optional. Enter a valid MAC address for this VNET\
 interface.',
    },
  ];
  public customConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'owner',
      placeholder: 'owner',
      tooltip: 'Type the owner of the jail. Can be any string.',
    },
    {
      type: 'input',
      name: 'priority',
      placeholder: 'priority',
      tooltip: 'Enter a numeric start priority for the jail at boot time.\
 <b>Smaller</b> values mean a <b>higher</b> priority. At system shutdown,\
 the priority is reversed. <b>Example:</b> <i>99</i>',
    },
    {
      type: 'input',
      name: 'hostid',
      placeholder: 'hostid',
      tooltip: 'Enter a new a jail hostid, if necessary. <b>Example\
 hostid:</b> <i>1a2bc345-678d-90e1-23fa-4b56c78901de</i>.',
    },
    {
      type: 'input',
      name: 'comment',
      placeholder: 'comment',
      tooltip: 'Type any comments about the jail.',
    },
    {
      type: 'input',
      name: 'depends',
      placeholder: 'depends',
      tooltip: 'Specify any jails this jail depends on. When this jail\
 begins to be created, any jails it depends on must already exist.',
    },
    {
      type: 'checkbox',
      name: 'bpf',
      placeholder: 'bpf',
      tooltip: 'Check to enable Berkely Packet Filter devices on jail\
 start.',
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: 'dhcp',
      tooltip: 'Check to start the jail with the Dynamic Host\
 Configuration Protocol enabled. <b>vnet</b> and <b>bpf</b> must also be\
 enabled.',
    },
    {
      type: 'checkbox',
      name: 'boot',
      placeholder: 'boot',
      tooltip: 'Check to auto-start this jail at system boot time. Jails\
 are started and stopped based on the <b>priority</b> value.',
    },
    {
      type: 'checkbox',
      name: 'mount_procfs',
      placeholder: 'mount_procfs',
      tooltip: 'Check to mount a <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=procfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">procfs(5)</a> filesystems in the jail\
 <ins>/dev/proc</ins> directory.',
    },
    {
      type: 'checkbox',
      name: 'mount_linprocfs',
      placeholder: 'mount_linprocfs',
      tooltip: 'Check to mount a <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=linprocfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">linprocfs(5)</a> filesystem in the jail.',
    },
    {
      type: 'checkbox',
      name: 'template',
      placeholder: 'template',
      tooltip: 'Check to set this jail as a template.',
    },
    {
      type: 'checkbox',
      name: 'host_time',
      placeholder: 'host_time',
      tooltip: 'Enter the system host time to synchronize the time\
 between jail and host.',
    },
    {
      type: 'checkbox',
      name: 'jail_zfs',
      placeholder: 'jail_zfs',
      tooltip: 'Check to enable automatic ZFS jailing inside the jail.\
 The assigned ZFS dataset is fully controlled by the jail.',
    },
    {
      type: 'input',
      name: 'jail_zfs_dataset',
      placeholder: 'jail_zfs_dataset',
      tooltip: '<b>jail_zfs</b> must be checked for this option to work.\
 Define the dataset to be jailed and fully handed over to a jail. Takes\
 the ZFS filesystem name without pool name.',
    },
    {
      type: 'input',
      name: 'jail_zfs_mountpoint',
      placeholder: 'jail_zfs_mountpoint',
      tooltip: 'Enter the mountpoint for the <b>jail_zfs_dataset</b>.\
 <b>Example:</b> <i>/data example-dataset-name</i>',
    },
  ];
  public rctlConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'memoryuse',
      placeholder: 'memoryuse',
      tooltip: 'Define the resident set size in bytes. See <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=rctl&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">RCTL(8)</a> for more details.',
    },
    {
      type: 'input',
      name: 'pcpu',
      placeholder: 'pcpu',
      tooltip: 'Write a percentage limit of a single CPU core.',
    },
    {
      type: 'checkbox',
      name: 'cpuset',
      placeholder: 'cpuset',
      tooltip: 'Define the jail CPU affinity. Options are <i>off</i> or\
 a combination of <i>1-4</i>, separated by commas (,). <b>Example:</b>\
 <i>1,2,3,4</i>',
    },
    {
      type: 'checkbox',
      name: 'rlimits',
      placeholder: 'rlimits',
      tooltip: 'Set resource limitations of the jail using the <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=setrlimit&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">getrlimit(2)</a> utility.',
    },
    {
      type: 'checkbox',
      name: 'memorylocked',
      placeholder: 'memorylocked',
      tooltip: 'Define in bytes the amount of locked memory for the jail.',
    },
    {
      type: 'checkbox',
      name: 'vmemoryuse',
      placeholder: 'vmemoryuse',
      tooltip: 'Define in bytes the address space limit for the jail.',
    },
    {
      type: 'checkbox',
      name: 'maxproc',
      placeholder: 'maxproc',
      tooltip: 'Enter a number to define the maximum number of processes\
 for the jail.',
    },
    {
      type: 'checkbox',
      name: 'cputime',
      placeholder: 'cputime',
      tooltip: 'Define the maximium amount of CPU time a jail process\
 may consume. The kernel will terminate processes exceeding the defined\
 limit.',
    },
    {
      type: 'checkbox',
      name: 'datasize',
      placeholder: 'datasize',
      tooltip: 'Define the jail data size in bytes.',
    },
    {
      type: 'checkbox',
      name: 'stacksize',
      placeholder: 'stacksize',
      tooltip: 'Define the jail stack size in bytes.',
    },
    {
      type: 'checkbox',
      name: 'coredumpsize',
      placeholder: 'coredumpsize',
      tooltip: 'Define the jail core dump size in bytes.',
    },
    {
      type: 'checkbox',
      name: 'openfiles',
      placeholder: 'openfiles',
      tooltip: 'Enter a numeric value to define the file descriptor\
 table size.',
    },
    {
      type: 'checkbox',
      name: 'pseudoterminals',
      placeholder: 'pseudoterminals',
      tooltip: 'Enter a numeric value for the number of PTYs available\
 to the jail.',
    },
    {
      type: 'checkbox',
      name: 'swapuse',
      placeholder: 'swapuse',
      tooltip: 'Enter a numeric value to define the maximum swap use for\
 the jail.',
    },
    {
      type: 'checkbox',
      name: 'nthr',
      placeholder: 'nthr',
      tooltip: 'Enter a numeric value for the number of threads the jail\
 can use.',
    },
    {
      type: 'checkbox',
      name: 'msgqqueued',
      placeholder: 'msgqqueued',
      tooltip: 'Define the number of queued SysV messages allowed for\
 the jail.',
    },
    {
      type: 'checkbox',
      name: 'msgqsize',
      placeholder: 'msgqsize',
      tooltip: 'Define in bytes the maximum SysV message queue size for\
 the jail.',
    },
    {
      type: 'checkbox',
      name: 'nmsgq',
      placeholder: 'nmsgq',
      tooltip: 'Define the maximum number of SysV message queues.',
    },
    {
      type: 'checkbox',
      name: 'nsemop',
      placeholder: 'nsemop',
      tooltip: 'Define the number of SysV semaphores modified in a single\
 <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=semop&sektion=2&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">semop(2)</a> call.',
    },
    {
      type: 'checkbox',
      name: 'nshm',
      placeholder: 'nshm',
      tooltip: 'Enter the number of SysV shared memory segments.',
    },
    {
      type: 'checkbox',
      name: 'shmsize',
      placeholder: 'shmsize',
      tooltip: 'Define in bytes the number of SysV shared memory segments.',
    },
    {
      type: 'checkbox',
      name: 'wallclock',
      placeholder: 'wallclock',
      tooltip: 'Define in seconds the wallclock time.',
    },
  ];

  protected releaseField: any;
  public step: any = 0;

  // fields only accpeted by ws with value 0/1
  protected TFfields: any = [
    'ip4_saddrsel',
    'ip6_saddrsel',
    'exec_clean',
    'mount_devfs',
    'mount_fdescfs',
    'allow_set_hostname',
    'allow_sysvipc',
    'allow_raw_sockets',
    'allow_chflags',
    'allow_mount',
    'allow_mount_devfs',
    'allow_mount_nullfs',
    'allow_mount_procfs',
    'allow_mount_tmpfs',
    'allow_mount_zfs',
    'allow_quotas',
    'allow_socket_af',
    'mount_procfs',
    'mount_linprocfs'
  ];
  // fields only accpeted by ws with value on/off
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
    'dhcp',
    'boot',
    'jail_zfs',
    'vnet',
  ];
  // fields only accpeted by ws with value yes/no
  protected YNfields: any = [
    'bpf',
    'template',
    'host_time',
  ];

  protected currentServerVersion: any;
  constructor(protected router: Router,
    protected jailService: JailService,
    protected ws: WebSocketService,
    protected entityFormService: EntityFormService,
    protected loader: AppLoaderService) {}

  ngOnInit() {
    this.releaseField = _.find(this.basicfieldConfig, { 'name': 'release' });
    this.ws.call('system.info').subscribe((res) => {
      this.currentServerVersion = Number(_.split(res.version, '-')[1]);
      this.jailService.getLocalReleaseChoices().subscribe((res_local) => {
        for (let j in res_local) {
          let rlVersion = Number(_.split(res_local[j], '-')[0]);
          if (this.currentServerVersion >= Math.floor(rlVersion)) {
            this.releaseField.options.push({ label: res_local[j] + '(fetched)', value: res_local[j] });
          }
        }
        this.jailService.getRemoteReleaseChoices().subscribe((res_remote) => {
          for (let i in res_remote) {
            if (_.indexOf(res_local, res_remote[i]) < 0) {
              let rmVersion = Number(_.split(res_remote[i], '-')[0]);
              if (this.currentServerVersion >= Math.floor(rmVersion)) {
                this.releaseField.options.push({ label: res_remote[i], value: res_remote[i] });
              }
            }
          }
        });
      });
    },
    (res) => {
      new EntityUtils().handleError(this, res);
    });

    this.formFileds = _.concat(this.basicfieldConfig, this.jailfieldConfig, this.networkfieldConfig, this.customConfig, this.rctlConfig);
    this.formGroup = this.entityFormService.createFormGroup(this.formFileds);
  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.error = null;
    let property: any = [];
    let value = _.cloneDeep(this.formGroup.value);

    for (let i in value) {
      if (value.hasOwnProperty(i)) {
        if (value[i] == undefined) {
          delete value[i];
        } else {
          console.log(i);
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
          } else if (_.indexOf(this.YNfields, i) > -1) {
            console.log('YNfield');
            if (value[i]) {
                property.push(i + '=yes');
              } else {
                property.push(i + '=no');
              }
              delete value[i];
          } else {
            if (i != 'uuid' && i != 'release') {
              property.push(i + '=' + value[i]);
              delete value[i];
            }
          }
        }
      }
    }
    value['props'] = property;

    this.loader.open();
    this.ws.job(this.addCall, [value]).subscribe(
      (res) => {
        this.loader.close();
        if (res.error) {
          this.error = res.error;
        } else {
          this.router.navigate(new Array('/').concat(this.route_success));
        }
      },
      (res) => {
        new EntityUtils().handleError(this, res);
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
