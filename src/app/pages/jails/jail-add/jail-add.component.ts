import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { T } from '../../../translate-marker'
import { TranslateService } from '@ngx-translate/core'
import { Validators } from '@angular/forms';

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
import { DialogService } from '../../../services/dialog.service';
import { regexValidator } from '../../common/entity/entity-form/validators/regex-validation';

@Component({
  selector: 'jail-add',
  templateUrl: './jail-add.component.html',
  providers: [JailService, EntityFormService, FieldRelationService]
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
      placeholder: T('Jail Name'),
      tooltip: T('A Jail Name can only contain alphanumeric characters \
                 (Aa-Zz 0-9), dashes (-), or underscores (_).'),
      required: true,
      validation: [ regexValidator(/^[a-zA-Z0-9-_]+$/) ],
    },
    {
      type: 'select',
      name: 'release',
      placeholder: T('Release'),
      tooltip: T('Select the FreeBSD release to use as the jail \
                  operating system. <br>\
                  Releases already downloaded display <b>(fetched)</b>.'),
        options: [],
      required: true,
      validation: [ Validators.required ],
    },
    {
      type: 'checkbox',
      name: 'dhcp',
      placeholder: T('DHCP autoconfigure IPv4'),
      tooltip: T('Set to start the jail with the Dynamic Host \
                  Configuration Protocol enabled. <b>VirtIO</b> and \
                  <b>Berkeley Packet Filter</b> must also be enabled.'),
    },
    {
      type: 'checkbox',
      name: 'vnet',
      placeholder: T('VNET'),
      tooltip: T('Set to use <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=vnet&sektion=9"\
                  target="_blank">VNET(9)</a> to emulate network \
                  devices for the jail. \
                  A fully virtualized per-jail network stack will be \
                  installed.'),
    },
    {
      type: 'checkbox',
      name: 'bpf',
      placeholder: T('Berkeley Packet Filter'),
      tooltip: T('Set to use the Berkeley Packet Filter (<a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=bpf&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">BPF(4)</a>) to data link layers in a \
                  protocol independent fashion.'),
    },
    {
      type: 'input',
      name: 'ip4_addr',
      placeholder: T('IPv4 Address'),
      tooltip: T('Configure IPv4 networking or internet access for the \
                  jail. Enter the IPv4 address for <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=vnet&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">VNET(9)</a> and shared IP jails. \
                  <br>Single interface format: <b>[interface|]\
                  ip-address\
                  [/netmask]</b>. <br>\
                  Example: <b>vnet2|192.168.0.15/24</b> <br>\
                  Multiple interface format: \
                  <b>[interface|]ip-address[/netmask],[interface|]\
                  ip-address[/netmask]</b>.<br>\
                  Example: <b>192.168.0.10/24,vnet3|192.168.10.50</b>'),
      relation: [{
      action: 'DISABLE',
      when: [{
        name: 'dhcp',
        value: true,
       }]
      }]
    },
    {
      type: 'input',
      name: 'defaultrouter',
      placeholder: T('Default IPv4 Route'),
      tooltip: T('A valid IPv4 address to use as the default route. \
                  <br>Enter <b>none</b> to configure the jail with \
                  no IPv4 default route. <br>\
                  <b>A jail without a default route will not be \
                  able to access the network without additional \
                  configuration.</b>'),
      relation: [{
        action: 'DISABLE',
        when: [{
          name: 'dhcp',
          value: true,
        }]
      }]
    },
    {
      type: 'input',
      name: 'ip6_addr',
      placeholder: T('IPv6 Address'),
      tooltip: T('Configure IPv6 networking or internet access for the \
                  jail. Enter the IPv6 address for <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=vnet&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">VNET(9)</a> and shared IP jails. \
                  <br>Single interface format: <b>[interface|]\
                  ip-address[/netmask]</b>. <br>\
                  Example: <b>re0|fe80::/64</b> <br>\
                  Multiple interface format: <b>[interface|]ip-address\
                  [/netmask],[interface|]ip-address[/netmask]</b>.<br>\
                  Example: <b>re1|2607:f0d0:1002:51:0000:0000:0000:0004,\
                  re5|2001:db8:85a3::8a2e:370:7334/24</b>'),
    },
    {
      type: 'input',
      name: 'defaultrouter6',
      placeholder: T('Default IPv6 Route'),
      tooltip: T('A valid IPv6 address to use as the default route. \
                  <br>Enter <b>none</b> to configure the jail with \
                  no IPv4 default route. <br>\
                  <b>A jail without a default route will not be \
                  able to access the network without additional \
                  configuration.'),
    },
    {
      type: 'input',
      name: 'notes',
      placeholder: T('Note'),
      tooltip: T('Save notes about the jail.'),
    },
    {
      type: 'checkbox',
      name: 'boot',
      placeholder: T('Auto-start'),
      tooltip: T('Set to auto-start the jail at system boot time. \
                  Jails are started and stopped based on iocage \
                  priority. Set in the <b>priority</b> field under \
                  <b>Custom Properties</b>.'),
    }
  ];
  public jailfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'devfs_ruleset',
      placeholder: T('devfs_ruleset'),
      tooltip: T('The number of the <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=devfs&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports\
                  "target="_blank">devfs(8) ruleset</a> to enforce when\
                  mounting <b>devfs</b> in the jail. The default value \
                  of <i>0</i> means no ruleset is enforced. Mounting \
                  <b>devfs</b> inside a jail is only possible when the \
                  <b>allow_mount</b> and <b>allow_mount_devfs</b> \
                  permissions are enabled and <b>enforce_statfs</b> is \
                  set to a value lower than <i>2</i>.'),
    },
    {
      type: 'input',
      name: 'exec_start',
      placeholder: T('exec.start'),
      tooltip: T('Commands to run in the jail environment when the jail \
                  is created. Example: <b>sh /etc/rc</b>. The pseudo-\
                  parameters section of <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=jail&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">JAIL(8)</a> describes \
                  <b>exec.start</b> usage.'),
    },
    {
      type: 'input',
      name: 'exec_stop',
      placeholder: T('exec.stop'),
      tooltip: T('Commands to run in the jail environment before the \
                  jail is removed and after <b>exec.prestop</b> \
                  commands are complete. Example: \
                  <i>sh /etc/rc.shutdown</i>.'),
    },
    {
      type: 'input',
      name: 'exec_prestart',
      placeholder: T('exec.prestart'),
      tooltip: T('Commands to run in the system environment before a \
                  jail is created.'),
    },
    {
      type: 'input',
      name: 'exec_poststart',
      placeholder: T('exec.poststart'),
      tooltip: T('Commands to run in the system environment after a \
                  jail is created and any <b>exec.start</b> commands \
                  are finished.'),
    },
    {
      type: 'input',
      name: 'exec_prestop',
      placeholder: T('exec.prestop'),
      tooltip: T('Commands to run in the system environment before a \
                  jail is removed.'),
    },
    {
      type: 'input',
      name: 'exec_poststop',
      placeholder: T('exec.poststop'),
      tooltip: T('Commands to run in the system environment after a \
                  jail is removed.'),
    },
    {
      type: 'checkbox',
      name: 'exec_clean',
      placeholder: T('exec.clean'),
      tooltip: T('Run commands in a clean environment. The current\
                  environment is discarded except for $HOME, $SHELL, \
                  $TERM, and $USER. <br>\
                  $HOME and $SHELL are set to the target login. $USER \
                  is set to the target login. $TERM is imported from \
                  the current environment. The environment variables \
                  from the login class capability database for the \
                  target login are also set.'),
    },
    {
      type: 'input',
      name: 'exec_timeout',
      placeholder: T('exec.timeout'),
      tooltip: T('Maximum amount of time in seconds to wait for a \
                  command to complete. A jail cannot be created or \
                  removed when a command is still running after the \
                  allotted time.'),
    },
    {
      type: 'input',
      name: 'stop_timeout',
      placeholder: T('stop.timeout'),
      tooltip: T('Maximum amount of time in seconds to wait for jail \
                  processes to exit after sending a SIGTERM signal. \
                  The timeout starts after <b>exec.stop</b> commands \
                  have completed. When time is up the jail is removed, \
                  killing any remaining processes. When set to \
                  <i>0</i>, no SIGTERM is sent and the jail is \
                  immediately removed. The default timeout is 10 \
                  seconds.'),
    },
    {
      type: 'input',
      name: 'exec_jail_user',
      placeholder: T('exec.jail_user'),
      tooltip: T('Run commands in the jail as this user. By default, \
                  commands are run as the current user.'),
    },
    {
      type: 'input',
      name: 'exec_system_jail_user',
      placeholder: T('exec.system_jail_user'),
      tooltip: T('Set this boolean option to <i>True</i> to look for \
                  the <b>exec.jail_user</b> in the system \
                  <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=passwd&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">passwd(5)</a> file <i>instead</i> of \
                  the jail passwd.'),
    },
    {
      type: 'input',
      name: 'exec_system_user',
      placeholder: T('exec.system_user'),
      tooltip: T('Run commands in the jail as this user. By default, \
                  commands are run as the current user.'),
    },
    {
      type: 'checkbox',
      name: 'mount_devfs',
      placeholder: T('mount.devfs'),
      tooltip: T('Mount a <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=devfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">devfs(5)</a> filesystem on the \
                  <i>chrooted /dev directory</i> and apply the ruleset \
                  in the <b>devfs_ruleset</b> parameter to restrict \
                  the devices visible inside the jail.'),
    },
    {
      type: 'checkbox',
      name: 'mount_fdescfs',
      placeholder: T('mount.fdescfs'),
      tooltip: T('Mount an <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=fdescfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">fdescfs(5)</a> filesystem in the \
                  jail <i>/dev/fd</i> directory.'),
    },
    {
      //"enforce_statfs": ("0", "1", "2"),
      type: 'select',
      name: 'enforce_statfs',
      placeholder: T('enforce_statfs'),
      tooltip: T('Determine which information the processes in a jail \
                  are able to obtain about mount points. The behavior \
                  of multiple syscalls is affected. <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">statfs(2)</a>, <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">fstatfs(2)</a>, <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=getfsstat&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">getfsstat(2)</a>, <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=fhstatfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">fhstatfs(2)</a>, and other similar \
                  compatibility syscalls. <br> \
                  Set to <i>0</i>: All mount points are available \
                  without restriction. <br>\
                  Set to <i>1</i>: Only mount points below the jail \
                  chroot directory are available. <br>\
                  Set to <i>2</i> (default): Only mounts point where \
                  the jail chroot directory is located are available.'),
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
      placeholder: T('children.max'),
      tooltip: T('Number of child jails allowed to be created by the \
                  jail or other jails under this jail. A limit of \
                  <i>0</i> restricts the jail from creating child \
                  jails. Hierarchical Jails in the <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=jail&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">JAIL(8)</a> man page explains the \
                  finer details.'),
    },
    {
      type: 'input',
      name: 'login_flags',
      placeholder: T('login_flags'),
      tooltip: T('Flags to pass to <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=login&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">LOGIN(1)</a> when logging in to the \
                  jail using the <b>console</b> function.'),
    },
    {
      type: 'input',
      name: 'securelevel',
      placeholder: T('securelevel'),
      tooltip: T('The value of the jail <a \
                  href="https://www.freebsd.org/doc/faq/security.html#idp60202568"\
                  target="_blank">securelevel</a> sysctl. A jail never \
                  has a lower securelevel than the host system. \
                  Setting this parameter allows a higher securelevel. \
                  If the host system securelevel is changed, jail \
                  securelevel will be at least as secure. <br>\
                  Securelevel options are <i>3</i>, <i>2</i>, \
                  <i>1</i>, <i>0</i>, and <i>-1</i>.'),
    },
    {
      type: 'select',
      name: 'sysvmsg',
      placeholder: T('sysvmsg'),
      tooltip: T('Allow or deny access to SYSV IPC message primitives. \
                  <br> <b>Inherit</b>: All IPC objects on the system \
                  are visible to the jail. <br>\
                  <b>New</b>: Only objects the jail creates using the \
                  private key namespace are visible. The system and \
                  parent jails have access to the jail objects but \
                  <i>not</i> private keys. <br>\
                  <b>Disable</b>: The jail cannot perform any \
                  <b>sysvmsg</b> related system calls.'),
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
      placeholder: T('sysvsem'),
      tooltip: T('Allow or deny access to SYSV IPC semaphore \
                  primitives. <br> <b>Inherit</b>: All IPC objects \
                  on the system are visible to the jail. <br>\
                  <b>New</b>: Only objects the jail creates using the \
                  private key namespace are visible. The system and \
                  parent jails have access to the jail objects but \
                  <i>not</i> private keys. <br> <b>Disable</b>: The \
                  jail cannot perform any <b>sysvmem</b> related \
                  system calls.'),
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
      placeholder: T('sysvshm'),
      tooltip: T('Allow or deny access to SYSV IPC shared memory \
                  primitives. <br>\
                  <b>Inherit</b>: All IPC objects on the system are \
                  visible to the jail. <br>\
                  <b>New</b>: Only objects the jail creates using the \
                  private key namespace are visible. The system and \
                  parent jails have access to the jail objects but \
                  <i>not</i> private keys. <br>\
                  <b>Disable</b>: The jail cannot perform any \
                  <b>sysvshm</b> related system calls.'),
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
      placeholder: T('allow.set_hostname'),
      tooltip: T('Allow the jail hostname to be changed with <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=hostname&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">hostname(1)</a> or <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=sethostname&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">sethostname(3)</a>.'),
    },
    {
      type: 'checkbox',
      name: 'allow_sysvipc',
      placeholder: T('*allow.sysvipc'),
      tooltip: T('Choose whether a process in the jail has access to \
                  System V IPC primitives. Equivalent to setting \
                  sysvmsg, sysvsem, and sysvshm to <b>Inherit</b>. \
                  <b>*Deprecated in FreeBSD 11.0 and later!</b><br> \
                  Use <b>sysvmsg</b>, <b>sysvsem</b>, and \
                  <b>sysvshm</b> instead.'),
    },
    {
      type: 'checkbox',
      name: 'allow_raw_sockets',
      placeholder: T('allow.raw_sockets'),
      tooltip: T('Set to allow raw sockets. Utilities like <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=ping&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">ping(8)</a> and <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=traceroute&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">traceroute(8)</a> require raw \
                  sockets. When set, source IP addresses are enforced \
                  to comply with the IP addresses bound to the jail, \
                  ignoring the IP_HDRINCL flag on the socket.'),
    },
    {
      type: 'checkbox',
      name: 'allow_chflags',
      placeholder: T('allow.chflags'),
      tooltip: T('Set to treat jail users as privileged and allow the \
                  manipulation of system file flags. \
                  <b>securelevel</b> constraints are still enforced.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount',
      placeholder: T('allow.mount'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount filesystem types marked as \
                  jail-friendly.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount_devfs',
      placeholder: T('allow.mount.devfs'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount the devfs file system. This \
                  permission is only effective when <b>allow_mount</b> \
                  is set and <b>enforce_statfs</b> is set to a value \
                  lower than <i>2</i>.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount_nullfs',
      placeholder: T('allow.mount.nullfs'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount the nullfs file system. This \
                  permission is only effective when <b>allow_mount</b> \
                  is set and and <b>enforce_statfs</b> is set to a \
                  value lower than <i>2</i>.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount_procfs',
      placeholder: T('allow.mount.procfs'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount the procfs file system. This \
                  permission is only effective when <b>allow_mount</b> \
                  is set and <b>enforce_statfs</b> is set to a value \
                  lower than <i>2</i>.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount_tmpfs',
      placeholder: T('allow.mount.tmpfs'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount the tmpfs file system. This \
                  permission is only effective when <b>allow_mount</b> \
                  is set and <b>enforce_statfs</b> is set to a value \
                  lower than <i>2</i>.'),
    },
    {
      type: 'checkbox',
      name: 'allow_mount_zfs',
      placeholder: T('allow.mount.zfs'),
      tooltip: T('Set to allow privileged users inside the jail to \
                  mount and unmount the ZFS file system. This \
                  permission is only effective when <b>allow_mount</b> \
                  is set and <b>enforce_statfs</b> is set to a value \
                  lower than <i>2</i>. The <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=zfs&sektion=8&apropos=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">ZFS(8)</a> man page has information \
                  on how to configure \
                  the ZFS filesystem to operate from within a jail.'),
    },
    {
      type: 'checkbox',
      name: 'allow_quotas',
      placeholder: T('allow.quotas'),
      tooltip: T('Set to allow the jail root to administer quotas on \
                  jail filesystems. This includes filesystems the \
                  jail shares with other jails or with non-jailed \
                  parts of the system.'),
    },
    {
      type: 'checkbox',
      name: 'allow_socket_af',
      placeholder: T('allow.socket_af'),
      tooltip: T('Set to allow access to other protocol stacks beyond \
                  IPv4, IPv6, local (UNIX), and route. <br>\
                  <b>Warning:</b> jail functionality does not exist \
                  for all protocal stacks.'),
    }
  ];
  public networkfieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'interfaces',
      placeholder: T('interfaces'),
      tooltip: T('List up to four interface configurations in the \
                  format <i>interface:bridge</i>, separated by a comma \
                  (,). The left value is the virtual VNET interface \
                  name and the right value is the bridge name where \
                  the virtual interface is attached.'),
    },
    {
      type: 'input',
      name: 'host_domainname',
      placeholder: T('host_domainname'),
      tooltip: T('Enter a <a \
                  href="https://www.freebsd.org/doc/handbook/network-nis.html"\
                  target="_blank">NIS Domain name</a> for the jail.'),
    },
    {
      type: 'input',
      name: 'host_hostname',
      placeholder: T('host.hostname'),
      tooltip: T('Set the jail hostname. Defaults to the jail UUID.'),
    },
    {
      type: 'input',
      name: 'exec_fib',
      placeholder: T('exec.fib'),
      tooltip: T('<a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=setfib&sektion=1&apropos=0&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">FIB </a> \
                  (routing table) to set when running commands inside \
                  the jail.'),
//There is SETFIB(1) that is network related, and SETFIB(2) that
//is system call related. As this tooltip is under the jail
//networking section, I went with SETFIB(1) the network related
//man page.
    },
    {
      type: 'checkbox',
      name: 'ip4_saddrsel',
      placeholder: T('ip4.saddrsel'),
      tooltip: T('Only available when the jail is not configured to \
                  use VNET. Disables IPv4 source address selection \
                  for the jail in favor of the primary IPv4 address of \
                  the jail.'),
    },
    {
      type: 'select',
      name: 'ip4',
      placeholder: T('ip4'),
      tooltip: T('Control the availability of IPv4 addresses. <br>\
                  <b>Inherit</b>: Allow unrestricted access to all \
                  system addresses. <br>\
                  <b>New</b>: Restrict addresses with <b>ip4_addr</b>. \
                  <br><b>Disable</b>: Stop the jail from using IPv4 \
                  entirely.'),
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
      placeholder: T('ip6_saddrsel'),
      tooltip: T('Only available when the jail is not configured to \
                  use VNET. Disables IPv6 source address selection \
                  for the jail in favor of the primary IPv6 address of \
                  the jail.'),
    },
    {
      type: 'select',
      name: 'ip6',
      placeholder: T('ip6'),
      tooltip: T('Control the availability of IPv6 addresses. <br>\
                  <b>Inherit</b>: Allow unrestricted access to all \
                  system addresses. <br>\
                  <b>New</b>: Restrict addresses with <b>ip6_addr</b>. \
                  <br><b>Disable</b>: Stop the jail from using IPv4 \
                  entirely.'),
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
      placeholder: T('resolver'),
      tooltip: T('Add lines to the jail <b>resolv.conf</b>. \
                  <b>Example:</b> <i>nameserver IP;search domain.\
                  local</i>. Fields must be delimited with a semicolon \
                  (;), This is translated as new lines in \
                  <b>resolv.conf</b>. Enter <i>none</i> to inherit \
                  <b>resolv.conf</b> from the host.'),
    },
    {
      type: 'input',
      name: 'mac_prefix',
      placeholder: T('mac_prefix'),
      tooltip: T('Enter a valid MAC address vendor prefix. \
                  <b>Example:</b> <i>E4F4C6</i>'),
    },
    {
      type: 'input',
      name: 'vnet0_mac',
      placeholder: T('vnet0_mac'),
      tooltip: T('Enter a valid MAC address for the VNET0 \
                  interface.'),
    },
    {
      type: 'input',
      name: 'vnet1_mac',
      placeholder: T('vnet1_mac'),
      tooltip: T('Enter a valid MAC address for the VNET1 \
                  interface.'),
    },
    {
      type: 'input',
      name: 'vnet2_mac',
      placeholder: T('vnet2_mac'),
      tooltip: T('Enter a valid MAC address for the VNET2 \
                  interface.'),
    },
    {
      type: 'input',
      name: 'vnet3_mac',
      placeholder: T('vnet3_mac'),
      tooltip: T('Enter a valid MAC address for the VNET3 \
                  interface.'),
    },
  ];
  public customConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'owner',
      placeholder: T('owner'),
      tooltip: T('Owner of the jail. Can be any string.'),
    },
    {
      type: 'input',
      name: 'priority',
      placeholder: T('priority'),
      tooltip: T('Numeric start priority for the jail at boot time. \
                  Valid priorities are between 1 and 99. \
                  <b>Smaller</b> values are <b>higher</b> priority. \
                  At system shutdown the priority is reversed. <br> \
                  <b>Example:</b> <i>99</i>'),
    },
    {
      type: 'input',
      name: 'hostid',
      placeholder: T('hostid'),
      tooltip: T('A new jail hostid, if desired. \
                  <br><b>Example hostid:</b> \
                  <i>1a2bc345-678d-90e1-23fa-4b56c78901de</i>.'),
    },
    {
      type: 'input',
      name: 'comment',
      placeholder: T('comment'),
      tooltip: T('Enter comments about the jail.'),
    },
    {
      type: 'input',
      name: 'depends',
      placeholder: T('depends'),
      tooltip: T('Specify any jails this jail depends on. Child \
                  jails must already exist before the parent jail \
                  can be created.'),
    },
    {
      type: 'checkbox',
      name: 'mount_procfs',
      placeholder: T('mount_procfs'),
      tooltip: T('Set to mount a <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=procfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">procfs(5)</a> filesystems in the \
                  jail <i>/dev/proc</i> directory.'),
    },
    {
      type: 'checkbox',
      name: 'mount_linprocfs',
      placeholder: T('mount_linprocfs'),
      tooltip: T('Set to mount a <a \
                  href="https://www.freebsd.org/cgi/man.cgi?query=linprocfs&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                  target="_blank">linprocfs(5)</a> filesystem in the \
                  jail.'),
    },
    // {
    //   type: 'checkbox',
    //   name: 'template',
    //   placeholder: T('template'),
    //   tooltip: T('Set to set this jail as a template.'),
    // },
    {
      type: 'checkbox',
      name: 'host_time',
      placeholder: T('host_time'),
      tooltip: T('System host time to synchronize the time between \
                  jail and host.'),
    },
    {
      type: 'checkbox',
      name: 'jail_zfs',
      placeholder: T('jail_zfs'),
      tooltip: T('Set to enable automatic ZFS jailing inside the \
                  jail. The assigned ZFS dataset is fully controlled \
                  by the jail.'),
    },
    {
      type: 'input',
      name: 'jail_zfs_dataset',
      placeholder: T('jail_zfs_dataset'),
      tooltip: T('Define the dataset to be jailed and fully handed \
                  over to a jail. Enter a ZFS filesystem name \
                  <i>without</i> a pool name. <br> \
                  <b>jail_zfs</b> must be checked for this option to \
                  work.'),
    },
    {
      type: 'input',
      name: 'jail_zfs_mountpoint',
      placeholder: T('jail_zfs_mountpoint'),
      tooltip: T('Enter the mountpoint for the \
                  <b>jail_zfs_dataset</b>. \
                  <b>Example:</b> <i>/data example-dataset-name</i>'),
    },
  ];
  public rctlConfig: FieldConfig[] = [

 //    {
 //      type: 'input',
 //      name: 'memoryuse',
 //      placeholder: T('memoryuse'),
 //      tooltip: T('Define the resident set size in bytes. See <a\
 // href="https://www.freebsd.org/cgi/man.cgi?query=rctl&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 // target="_blank">RCTL(8)</a> for more details.'),
 //    },
 //    {
 //      type: 'input',
 //      name: 'pcpu',
 //      placeholder: T('pcpu'),
 //      tooltip: T('Write a percentage limit of a single CPU core.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'cpuset',
 //      placeholder: T('cpuset'),
 //      tooltip: T('Define the jail CPU affinity. Options are <i>off</i> or\
 // a combination of <i>1-4</i>, separated by commas (,). <b>Example:</b>\
 // <i>1,2,3,4</i>'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'rlimits',
 //      placeholder: T('rlimits'),
 //      tooltip: T('Set resource limitations of the jail using the <a\
 // href="https://www.freebsd.org/cgi/man.cgi?query=setrlimit&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 // target="_blank">getrlimit(2)</a> utility.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'memorylocked',
 //      placeholder: T('memorylocked'),
 //      tooltip: T('Define in bytes the amount of locked memory for the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'vmemoryuse',
 //      placeholder: T('vmemoryuse'),
 //      tooltip: T('Define in bytes the address space limit for the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'maxproc',
 //      placeholder: T('maxproc'),
 //      tooltip: T('Enter a number to define the maximum number of processes\
 // for the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'cputime',
 //      placeholder: T('cputime'),
 //      tooltip: T('Define the maximium amount of CPU time a jail process\
 // may consume. The kernel will terminate processes exceeding the defined\
 // limit.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'datasize',
 //      placeholder: T('datasize'),
 //      tooltip: T('Define the jail data size in bytes.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'stacksize',
 //      placeholder: T('stacksize'),
 //      tooltip: T('Define the jail stack size in bytes.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'coredumpsize',
 //      placeholder: T('coredumpsize'),
 //      tooltip: T('Define the jail core dump size in bytes.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'openfiles',
 //      placeholder: T('openfiles'),
 //      tooltip: T('Enter a numeric value to define the file descriptor\
 // table size.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'pseudoterminals',
 //      placeholder: T('pseudoterminals'),
 //      tooltip: T('Enter a numeric value for the number of PTYs available\
 // to the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'swapuse',
 //      placeholder: T('swapuse'),
 //      tooltip: T('Enter a numeric value to define the maximum swap use for\
 // the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nthr',
 //      placeholder: T('nthr'),
 //      tooltip: T('Enter a numeric value for the number of threads the jail\
 // can use.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'msgqqueued',
 //      placeholder: T('msgqqueued'),
 //      tooltip: T('Define the number of queued SysV messages allowed for\
 // the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'msgqsize',
 //      placeholder: T('msgqsize'),
 //      tooltip: T('Define in bytes the maximum SysV message queue size for\
 // the jail.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nmsgq',
 //      placeholder: T('nmsgq'),
 //      tooltip: T('Define the maximum number of SysV message queues.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nsemop',
 //      placeholder: T('nsemop'),
 //      tooltip: T('Define the number of SysV semaphores modified in a single\
 // <a\
 // href="https://www.freebsd.org/cgi/man.cgi?query=semop&sektion=2&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 // target="_blank">semop(2)</a> call.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'nshm',
 //      placeholder: T('nshm'),
 //      tooltip: T('Enter the number of SysV shared memory segments.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'shmsize',
 //      placeholder: T('shmsize'),
 //      tooltip: T('Define in bytes the number of SysV shared memory segments.'),
 //    },
 //    {
 //      type: 'checkbox',
 //      name: 'wallclock',
 //      placeholder: T('wallclock'),
 //      tooltip: T('Define in seconds the wallclock time.'),
 //    },
  ];

  protected releaseField: any;
  public step: any = 0;

  // fields only accepted by ws with value 0/1
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
    'dhcp',
    'boot',
    'jail_zfs',
    'vnet',
  ];
  // fields only accepted by ws with value yes/no
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
    protected fieldRelationService: FieldRelationService,
    protected loader: AppLoaderService,
    public translate: TranslateService,
    protected dialogService: DialogService) {}

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
      if (this.formGroup.controls['dhcp'].value && !res) {
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).hasErrors = true;
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).errors = 'Vnet is required';
      } else {
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).hasErrors = false;
        _.find(this.basicfieldConfig, { 'name': 'vnet' }).errors = '';
      }
    });
    this.formGroup.controls['bpf'].valueChanges.subscribe((res) => {
      if (this.formGroup.controls['dhcp'].value && !res) {
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).hasErrors = true;
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).errors = 'BPF is required';
      } else {
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).hasErrors = false;
        _.find(this.basicfieldConfig, { 'name': 'bpf' }).errors = '';
      }
    });

    this.ws.call("jail.query", [
      [
        ["jail", "=", "default"]
      ]
    ]).subscribe(
    (res) => {
      for (let i in res[0]) {
        if (this.formGroup.controls[i]) {
          if (_.indexOf(this.TFfields, i) > 0) {
            if (res[0][i] == '1') {
              res[0][i] = true;
            } else {
              res[0][i] = false;
            }
          }
          if (_.indexOf(this.OFfields, i) > 0) {
            if (res[0][i] == 'on') {
              res[0][i] = true;
            } else {
              res[0][i] = false;
            }
          }
          if (_.indexOf(this.YNfields, i) > 0) {
            if (res[0][i] == 'yes') {
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
        this.loader.close();
        this.dialogService.errorReport('Error ' + res.error + ':' + res.reason, res.trace.class, res.trace.formatted);
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
