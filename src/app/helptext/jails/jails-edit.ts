import { T } from '../../translate-marker';

export default {

host_hostuuid_placeholder: T('UUID'),
host_hostuuid_tooltip: T('The numeric <i>UUID</i> or <i>custom name</i> of the \
jail.'),

release_placeholder: T('Release'),
release_tooltip: T('Select the FreeBSD release to use as the jail \
operating system. <br>\
Releases already downloaded display <b>(fetched)</b>.'),

dhcp_placeholder: T('DHCP Autoconfigure IPv4'),
dhcp_tooltip: T('Set to start the jail with the Dynamic Host \
Configuration Protocol enabled. <b>VNET</b> and \
<b>Berkeley Packet Filter</b> must also be enabled.'),

nat_placeholder: T('NAT'),
nat_tooltip: T(''),

vnet_placeholder: T('VNET'),
vnet_tooltip: T('Set to use <a \
href="https://www.freebsd.org/cgi/man.cgi?query=vnet&sektion=9" \
target="_blank">VNET(9)</a> to emulate network \
devices for the jail. \
A fully virtualized per-jail network stack will be \
installed.'),

bpf_placeholder: T('Berkeley Packet Filter'),
bpf_tooltip: T('Set to use the Berkeley Packet Filter (<a \
href="https://www.freebsd.org/cgi/man.cgi?query=bpf&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">BPF(4)</a>) to data link layers in a \
protocol independent fashion.'),

ip4_interface_placeholder: T('IPv4 Interface'),
ip4_interface_tooltip: T('IPv4 interface for the jail.'),

ip4_addr_placeholder: T('IPv4 Address'),
ip4_addr_tooltip: T('Configure IPv4 networking or internet access for the \
jail. Enter the IPv4 address for <a \
href="https://www.freebsd.org/cgi/man.cgi?query=vnet&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">VNET(9)</a> and shared IP jails. \
<br>Single interface format: <b>[interface|]\
ip-address\
[/netmask]</b>. <br>\
Example: <b>vnet2|192.168.0.15/24</b> <br>\
Multiple interface format: \
<b>[interface|]ip-address[/netmask],[interface|]\
ip-address[/netmask]</b>.<br>\
Example: <b>192.168.0.10/24,vnet3|192.168.10.50</b>'),

ip4_netmask_placeholder: T('IPv4 Netmask'),
ip4_netmask_tooltip: T('IPv4 netmask for the jail.'),

defaultrouter_placeholder: T('IPv4 Default Router'),
defaultrouter_tooltip: T('A valid IPv4 address to use as the default route. \
<br>Enter <b>none</b> to configure the jail with \
no IPv4 default route. <br>\
<b>A jail without a default route will not be \
able to access the network without additional \
configuration.</b>'),

auto_configure_ip6_placeholder: T('Autoconfigure IPv6'),
auto_configure_ip6_tooltip: T('Set to use SLAAC (Stateless Address Auto \
Configuration) to autoconfigure IPv6 in the jail.'),


ip6_interface_placeholder: T('IPv6 Interface'),
ip6_interface_tooltip: T('IPv6 interface for the jail.'),

ip6_addr_placeholder: T('IPv6 Address'),
ip6_addr_tooltip: T('Configure IPv6 networking or internet access for the \
jail. Enter the IPv6 address for <a \
href="https://www.freebsd.org/cgi/man.cgi?query=vnet&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">VNET(9)</a> and shared IP jails. \
<br>Single interface format: <b>[interface|]\
ip-address[/netmask]</b>. <br>\
Example: <b>re0|fe80::/64</b> <br>\
Multiple interface format: <b>[interface|]ip-address\
[/netmask],[interface|]ip-address[/netmask]</b>.<br>\
Example: <b>re1|2607:f0d0:1002:51:0000:0000:0000:0004, \
re5|2001:db8:85a3::8a2e:370:7334/24</b>'),

ip6_prefix_placeholder: T('IPv6 Prefix'),
ip6_prefix_tooltip: T('IPv6 prefix for the jail.'),

defaultrouter6_placeholder: T('IPv6 Default Route'),
defaultrouter6_tooltip: T('A valid IPv6 address to use as the default route. \
<br>Enter <b>none</b> to configure the jail without \
an IPv6 default route. <br>\
<b>A jail without a default route will not be \
able to access the network without additional \
configuration.'),

notes_placeholder: T('Note'),
notes_tooltip: T('Save notes about the jail.'),

boot_placeholder: T('Auto-start'),
boot_tooltip: T('Set to auto-start the jail at system boot time. \
Jails are started and stopped based on iocage \
priority. Set in the <b>priority</b> field under \
<b>Custom Properties</b>.'),

devfs_ruleset_placeholder: T('devfs_ruleset'),
devfs_ruleset_tooltip: T('The number of the <a \
href="https://www.freebsd.org/cgi/man.cgi?query=devfs&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports \
"target="_blank">devfs(8) ruleset</a> to enforce when \
mounting <b>devfs</b> in the jail. The default value \
of <i>0</i> means no ruleset is enforced. Mounting \
<b>devfs</b> inside a jail is only possible when the \
<b>allow_mount</b> and <b>allow_mount_devfs</b> \
permissions are enabled and <b>enforce_statfs</b> is \
set to a value lower than <i>2</i>.'),

exec_start_placeholder: T('exec_start'),
exec_start_tooltip: T('Commands to run in the jail environment when the jail \
is created. Example: <b>sh /etc/rc</b>. The pseudo-\
parameters section of <a \
href="https://www.freebsd.org/cgi/man.cgi?query=jail&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">JAIL(8)</a> describes \
<b>exec.start</b> usage.'),

exec_stop_placeholder: T('exec_stop'),
exec_stop_tooltip: T('Commands to run in the jail environment before the \
jail is removed and after <b>exec.prestop</b> \
commands are complete. Example: \
<i>sh /etc/rc.shutdown</i>.'),

exec_prestart_placeholder: T('exec_prestart'),
exec_prestart_tooltip: T('Commands to run in the system environment before a \
jail is created.'),

exec_poststart_placeholder: T('exec_poststart'),
exec_poststart_tooltip: T('Commands to run in the system environment after a \
jail is created and any <b>exec.start</b> commands \
are finished.'),

exec_prestop_placeholder: T('exec_prestop'),
exec_prestop_tooltip: T('Commands to run in the system environment before a \
jail is removed.'),

exec_poststop_placeholder: T('exec_poststop'),
exec_poststop_tooltip: T('Commands to run in the system environment after a \
jail is removed.'),

exec_clean_placeholder: T('exec_clean'),
exec_clean_tooltip: T('Run commands in a clean environment. The current \
environment is discarded except for $HOME, $SHELL, \
$TERM, and $USER. <br>\
$HOME and $SHELL are set to the target login. $USER \
is set to the target login. $TERM is imported from \
the current environment. The environment variables \
from the login class capability database for the \
target login are also set.'),

exec_timeout_placeholder: T('exec_timeout'),
exec_timeout_tooltip: T('Maximum amount of time in seconds to wait for a \
command to complete. A jail cannot be created or \
removed when a command is still running after the \
allotted time.'),

stop_timeout_placeholder: T('stop_timeout'),
stop_timeout_tooltip: T('Maximum amount of time in seconds to wait for jail \
processes to exit after sending a SIGTERM signal. \
The timeout starts after <b>exec.stop</b> commands \
have completed. When time is up the jail is removed, \
killing any remaining processes. When set to \
<i>0</i>, no SIGTERM is sent and the jail is \
immediately removed. The default timeout is 10 \
seconds.'),

exec_jail_user_placeholder: T('exec_jail_user'),
exec_jail_user_tooltip: T('Run commands in the jail as this user. By default, \
commands are run as the current user.'),

exec_system_jail_user_placeholder: T('exec_system_jail_user'),
exec_system_jail_user_tooltip: T('Set this boolean option to <i>True</i> to look for \
the <b>exec.jail_user</b> in the system \
<a \
href="https://www.freebsd.org/cgi/man.cgi?query=passwd&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">passwd(5)</a> file <i>instead</i> of \
the jail passwd.'),

exec_system_user_placeholder: T('exec_system_user'),
exec_system_user_tooltip: T('Run commands in the jail as this user. By default, \
commands are run as the current user.'),

mount_devfs_placeholder: T('mount_devfs'),
mount_devfs_tooltip: T('Mount a <a \
href="https://www.freebsd.org/cgi/man.cgi?query=devfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">devfs(5)</a> filesystem on the \
<i>chrooted /dev directory</i> and apply the ruleset \
in the <b>devfs_ruleset</b> parameter to restrict \
the devices visible inside the jail.'),

mount_fdescfs_placeholder: T('mount_fdescfs'),
mount_fdescfs_tooltip: T('Mount an <a \
href="https://www.freebsd.org/cgi/man.cgi?query=fdescfs&sektion=5&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">fdescfs(5)</a> filesystem in the \
jail <i>/dev/fd</i> directory.'),

enforce_statfs_placeholder: T('enforce_statfs'),
enforce_statfs_tooltip: T('Determine which information the processes in a jail \
are able to obtain about mount points. The behavior \
of multiple syscalls is affected. <a \
href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">statfs(2)</a>, <a \
href="https://www.freebsd.org/cgi/man.cgi?query=statfs&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">fstatfs(2)</a>, <a \
href="https://www.freebsd.org/cgi/man.cgi?query=getfsstat&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">getfsstat(2)</a>, <a \
href="https://www.freebsd.org/cgi/man.cgi?query=fhstatfs&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">fhstatfs(2)</a>, and other similar \
compatibility syscalls. <br> \
Set to <i>0</i>: All mount points are available \
without restriction. <br>\
Set to <i>1</i>: Only mount points below the jail \
chroot directory are available. <br>\
Set to <i>2</i> (default): Only mounts point where \
the jail chroot directory is located are available.'),

children_max_placeholder: T('children_max'),
children_max_tooltip: T('Number of child jails allowed to be created by the \
jail or other jails under this jail. A limit of \
<i>0</i> restricts the jail from creating child \
jails. Hierarchical Jails in the <a \
href="https://www.freebsd.org/cgi/man.cgi?query=jail&apropos=0&sektion=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">JAIL(8)</a> man page explains the \
finer details.'),

login_flags_placeholder: T('login_flags'),
login_flags_tooltip: T('Flags to pass to <a \
href="https://www.freebsd.org/cgi/man.cgi?query=login&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">LOGIN(1)</a> when logging in to the \
jail using the <b>console</b> function.'),

securelevel_placeholder: T('securelevel'),
securelevel_tooltip: T('The value of the jail <a \
href="https://www.freebsd.org/doc/faq/security.html#idp60202568" \
target="_blank">securelevel</a> sysctl. A jail never \
has a lower securelevel than the host system. \
Setting this parameter allows a higher securelevel. \
If the host system securelevel is changed, the jail \
securelevel will be at least as secure.'),

sysvmsg_placeholder: T('sysvmsg'),
sysvmsg_tooltip: T('Allow or deny access to SYSV IPC message primitives. \
<br> <b>Inherit</b>: All IPC objects on the system \
are visible to the jail. <br>\
<b>New</b>: Only objects the jail creates using the \
private key namespace are visible. The system and \
parent jails have access to the jail objects but \
<i>not</i> private keys. <br>\
<b>Disable</b>: The jail cannot perform any \
<b>sysvmsg</b> related system calls.'),

sysvsem_placeholder: T('sysvsem'),
sysvsem_tooltip: T('Allow or deny access to SYSV IPC semaphore \
primitives. <br> <b>Inherit</b>: All IPC objects \
on the system are visible to the jail. <br>\
<b>New</b>: Only objects the jail creates using the \
private key namespace are visible. The system and \
parent jails have access to the jail objects but \
<i>not</i> private keys. <br> <b>Disable</b>: The \
jail cannot perform any <b>sysvmem</b> related \
system calls.'),

sysvshm_placeholder: T('sysvshm'),
sysvshm_tooltip: T('Allow or deny access to SYSV IPC shared memory \
primitives. <br>\
<b>Inherit</b>: All IPC objects on the system are \
visible to the jail. <br>\
<b>New</b>: Only objects the jail creates using the \
private key namespace are visible. The system and \
parent jails have access to the jail objects but \
<i>not</i> private keys. <br>\
<b>Disable</b>: The jail cannot perform any \
<b>sysvshm</b> related system calls.'),

allow_set_hostname_placeholder: T('allow_set_hostname'),
allow_set_hostname_tooltip: T('Allow the jail hostname to be changed with <a \
href="https://www.freebsd.org/cgi/man.cgi?query=hostname&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">hostname(1)</a> or <a \
href="https://www.freebsd.org/cgi/man.cgi?query=sethostname&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">sethostname(3)</a>.'),

allow_sysvipc_placeholder: T('*allow_sysvipc'),
allow_sysvipc_tooltip: T('Choose whether a process in the jail has access to \
System V IPC primitives. Equivalent to setting \
sysvmsg, sysvsem, and sysvshm to <b>Inherit</b>. \
<b>*Deprecated in FreeBSD 11.0 and later!</b><br> \
Use <b>sysvmsg</b>, <b>sysvsem</b>, and \
<b>sysvshm</b> instead.'),

allow_raw_sockets_placeholder: T('allow_raw_sockets'),
allow_raw_sockets_tooltip: T('Set to allow raw sockets. Utilities like <a \
href="https://www.freebsd.org/cgi/man.cgi?query=ping&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">ping(8)</a> and <a \
href="https://www.freebsd.org/cgi/man.cgi?query=traceroute&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">traceroute(8)</a> require raw \
sockets. When set, source IP addresses are enforced \
to comply with the IP addresses bound to the jail, \
ignoring the IP_HDRINCL flag on the socket.'),

allow_chflags_placeholder: T('allow_chflags'),
allow_chflags_tooltip: T('Set to treat jail users as privileged and allow the \
manipulation of system file flags. \
<b>securelevel</b> constraints are still enforced.'),

allow_mlock_placeholder: T('allow_mlock'),
allow_mlock_tooltip: T(''),

allow_mount_placeholder: T('allow_mount'),
allow_mount_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount filesystem types marked as \
jail-friendly.'),

allow_mount_devfs_placeholder: T('allow_mount_devfs'),
allow_mount_devfs_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount the devfs file system. This \
permission is only effective when <b>allow_mount</b> \
is set and <b>enforce_statfs</b> is set to a value \
lower than <i>2</i>.'),

allow_mount_fusefs_placeholder: T('allow_mount_fusefs'),
allow_mount_fusefs_tooltip: T(''),

allow_mount_nullfs_placeholder: T('allow_mount_nullfs'),
allow_mount_nullfs_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount the nullfs file system. This \
permission is only effective when <b>allow_mount</b> \
is set and and <b>enforce_statfs</b> is set to a \
value lower than <i>2</i>.'),

allow_mount_procfs_placeholder: T('allow_mount_procfs'),
allow_mount_procfs_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount the procfs file system. This \
permission is only effective when <b>allow_mount</b> \
is set and <b>enforce_statfs</b> is set to a value \
lower than <i>2</i>.'),

allow_mount_tmpfs_placeholder: T('allow_mount_tmpfs'),
allow_mount_tmpfs_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount the tmpfs file system. This \
permission is only effective when <b>allow_mount</b> \
is set and <b>enforce_statfs</b> is set to a value \
lower than <i>2</i>.'),

allow_mount_zfs_placeholder: T('allow_mount_zfs'),
allow_mount_zfs_tooltip: T('Set to allow privileged users inside the jail to \
mount and unmount the ZFS file system. This \
permission is only effective when <b>allow_mount</b> \
is set and <b>enforce_statfs</b> is set to a value \
lower than <i>2</i>. The <a \
href="https://www.freebsd.org/cgi/man.cgi?query=zfs&sektion=8&apropos=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">ZFS(8)</a> man page has information \
on how to configure \
the ZFS filesystem to operate from within a jail.'),

allow_vmm_placeholder: T('allow_vmm'),
allow_vmm_tooltip: T(''),

allow_quotas_placeholder: T('allow_quotas'),
allow_quotas_tooltip: T('Set to allow the jail root to administer quotas on \
jail filesystems. This includes filesystems the \
jail shares with other jails or with non-jailed \
parts of the system.'),

allow_socket_af_placeholder: T('allow_socket_af'),
allow_socket_af_tooltip: T('Set to allow access to other protocol stacks beyond \
IPv4, IPv6, local (UNIX), and route. <br>\
<b>Warning:</b> jail functionality does not exist \
for all protocal stacks.'),

vnet_interfaces_placeholder: T('vnet_interfaces'),
vnet_interfaces_tooltip: T(''),

// network field config
interfaces_placeholder: T('interfaces'),
interfaces_tooltip: T('List up to four interface configurations in the \
format <i>interface:bridge</i>, separated by a comma \
(,). The left value is the virtual VNET interface \
name and the right value is the bridge name where \
the virtual interface is attached.'),

host_domainname_placeholder: T('host_domainname'),
host_domainname_tooltip: T('Enter a <a \
href="https://www.freebsd.org/doc/handbook/network-nis.html" \
target="_blank">NIS Domain name</a> for the jail.'),

host_hostname_placeholder: T('host_hostname'),
host_hostname_tooltip: T('Set the jail hostname. Defaults to the jail UUID.'),

exec_fib_placeholder: T('exec_fib'),
exec_fib_tooltip: T('<a \
href="https://www.freebsd.org/cgi/man.cgi?query=setfib&sektion=1&apropos=0&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">FIB </a> \
(routing table) to set when running commands inside \
the jail.'),

ip4_saddrsel_placeholder: T('ip4_saddrsel'),
ip4_saddrsel_tooltip: T('Only available when the jail is not configured to \
use VNET. Disables IPv4 source address selection \
for the jail in favor of the primary IPv4 address of \
the jail.'),

ip4_placeholder: T('ip4'),
ip4_tooltip: T('Control the availability of IPv4 addresses. <br>\
<b>Inherit</b>: Allow unrestricted access to all \
system addresses. <br>\
<b>New</b>: Restrict addresses with <b>ip4_addr</b>. \
<br><b>Disable</b>: Stop the jail from using IPv4 \
entirely.'),

ip6_saddrsel_placeholder: T('ip6_saddrsel'),
ip6_saddrsel_tooltip: T('Only available when the jail is not configured to \
use VNET. Disables IPv6 source address selection \
for the jail in favor of the primary IPv6 address of \
the jail.'),

ip6_placeholder: T('ip6'),
ip6_tooltip: T('Control the availability of IPv6 addresses. <br>\
<b>Inherit</b>: Allow unrestricted access to all \
system addresses. <br>\
<b>New</b>: Restrict addresses with <b>ip6_addr</b>. \
<br><b>Disable</b>: Stop the jail from using IPv4 \
entirely.'),

resolver_placeholder: T('resolver'),
resolver_tooltip: T('Add lines to the jail <b>resolv.conf</b>. \
<b>Example:</b> <i>nameserver IP;search domain. \
local</i>. Fields must be delimited with a semicolon \
(;), This is translated as new lines in \
<b>resolv.conf</b>. Enter <i>none</i> to inherit \
<b>resolv.conf</b> from the host.'),

mac_prefix_placeholder: T('mac_prefix'),
mac_prefix_tooltip: T('Enter a valid MAC address vendor prefix. \
<b>Example:</b> <i>E4F4C6</i>'),

vnet_default_interface_placeholder: T('vnet_default_interface'),
vnet_default_interface_tooltip: T('Set the default VNET interface. \
Only takes effect when <i>VNET</i> is set. Choose a specific \
interface, or set to <i>auto</i> to use the interface that has the \
default route. Choose <i>none</i> to not set a default VNET \
interface.'),

vnet0_mac_placeholder: T('vnet0_mac'),
vnet0_mac_tooltip: T('Enter a valid MAC address for the VNET0 \
interface.'),

vnet1_mac_placeholder: T('vnet1_mac'),
vnet1_mac_tooltip: T('Enter a valid MAC address for the VNET1 \
interface.'),

vnet2_mac_placeholder: T('vnet2_mac'),
vnet2_mac_tooltip: T('Enter a valid MAC address for the VNET2 \
interface.'),

vnet3_mac_placeholder: T('vnet3_mac'),
vnet3_mac_tooltip: T('Enter a valid MAC address for the VNET3 \
interface.'),

owner_placeholder: T('owner'),
owner_tooltip: T('Owner of the jail. Can be any string.'),

priority_placeholder: T('priority'),
priority_tooltip: T('Numeric start priority for the jail at boot time. \
Valid priorities are between 1 and 99. \
<b>Smaller</b> values are <b>higher</b> priority. \
At system shutdown the priority is reversed. <br> \
<b>Example:</b> <i>99</i>'),

hostid_placeholder: T('hostid'),
hostid_tooltip: T('A new jail hostid, if desired. \
<br><b>Example hostid:</b> \
<i>1a2bc345-678d-90e1-23fa-4b56c78901de</i>.'),

hostid_strict_check_placeholder: T('hostid_strict_check'),
hostid_strict_check_tooltip: T(''),

comment_placeholder: T('comment'),
comment_tooltip: T('Enter comments about the jail.'),

depends_placeholder: T('depends'),
depends_tooltip: T('Specify any jails this jail depends on. Child \
jails must already exist before the parent jail \
can be created.'),

mount_procfs_placeholder: T('mount_procfs'),
mount_procfs_tooltip: T('Set to mount a <a \
href="https://www.freebsd.org/cgi/man.cgi?query=procfs&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">procfs(5)</a> filesystems in the \
jail <i>/dev/proc</i> directory.'),

mount_linprocfs_placeholder: T('mount_linprocfs'),
mount_linprocfs_tooltip: T('Set to mount a <a \
href="https://www.freebsd.org/cgi/man.cgi?query=linprocfs&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">linprocfs(5)</a> filesystem in the \
jail.'),

template_placeholder: T('template'),
template_tooltip: T('Set to set this jail as a template.'),

host_time_placeholder: T('host_time'),
host_time_tooltip: T('System host time to synchronize the time between \
jail and host.'),

jail_zfs_placeholder: T('jail_zfs'),
jail_zfs_tooltip: T('Set to enable automatic ZFS jailing inside the \
jail. The assigned ZFS dataset is fully controlled \
by the jail.'),

jail_zfs_dataset_placeholder: T('jail_zfs_dataset'),
jail_zfs_dataset_tooltip: T('Define the dataset to be jailed and fully handed \
over to a jail. Enter a ZFS filesystem name \
<i>without</i> a pool name. <br> \
<b>jail_zfs</b> must be checked for this option to \
work.'),

jail_zfs_mountpoint_placeholder: T('jail_zfs_mountpoint'),
jail_zfs_mountpoint_tooltip: T('Enter the mountpoint for the \
<b>jail_zfs_dataset</b>. \
<b>Example:</b> <i>/data example-dataset-name</i>'),

allow_tun_placeholder: T('allow_tun'),
allow_tun_tooltip: T(''),

rtsold_placeholder: T('Autoconfigure IPv6 with rtsold'),
rtsold_tooltip: T('Use <a href="https://www.freebsd.org/cgi/man.cgi?query=rtsold" \
target="_blank">rtsold(8)</a> as part of IPv6 autoconfiguration. \
Send ICMPv6 Router Solicitation messages to interfaces to discover new routers.'),

ip_hostname_placeholder: T('ip_hostname'),
ip_hostname_tooltip: T(''),

assign_localhost_placeholder: T('assign_localhost'),
assign_localhost_tooltip: T(''),

//rctl config
memoryuse_placeholder: T('memoryuse'),
memoryuse_tooltip: T('Define the resident set size in bytes. See <a \
href="https://www.freebsd.org/cgi/man.cgi?query=rctl&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">RCTL(8)</a> for more details.'),

pcpu_placeholder: T('pcpu'),
pcpu_tooltip: T('Write a percentage limit of a single CPU core.'),

cpuset_placeholder: T('cpuset'),
cpuset_tooltip: T('Define the jail CPU affinity. Options are <i>off</i> or \
a combination of <i>1-4</i>, separated by commas (,). <b>Example:</b> \
<i>1,2,3,4</i>'),

rlimits_placeholder: T('rlimits'),
rlimits_tooltip: T('Set resource limitations of the jail using the <a \
href="https://www.freebsd.org/cgi/man.cgi?query=setrlimit&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">getrlimit(2)</a> utility.'),

memorylocked_placeholder: T('memorylocked'),
memorylocked_tooltip: T('Define in bytes the amount of locked memory for the jail.'),

vmemoryuse_placeholder: T('vmemoryuse'),
vmemoryuse_tooltip: T('Define in bytes the address space limit for the jail.'),

maxproc_placeholder: T('maxproc'),
maxproc_tooltip: T('Enter a number to define the maximum number of processes \
for the jail.'),

cputime_placeholder: T('cputime'),
cputime_tooltip: T('Define the maximum amount of CPU time a jail process \
may consume. The kernel terminates processes exceeding the defined \
limit.'),

datasize_placeholder: T('datasize'),
datasize_tooltip: T('Define the jail data size in bytes.'),

stacksize_placeholder: T('stacksize'),
stacksize_tooltip: T('Define the jail stack size in bytes.'),

coredumpsize_placeholder: T('coredumpsize'),
coredumpsize_tooltip: T('Define the jail core dump size in bytes.'),

openfiles_placeholder: T('openfiles'),
openfiles_tooltip: T('Enter a numeric value to define the file descriptor \
table size.'),

pseudoterminals_placeholder: T('pseudoterminals'),
pseudoterminals_tooltip: T('Enter a numeric value for the number of PTYs available \
to the jail.'),

swapuse_placeholder: T('swapuse'),
swapuse_tooltip: T('Enter a numeric value to define the maximum swap use for \
the jail.'),

nthr_placeholder: T('nthr'),
nthr_tooltip: T('Enter a numeric value for the number of threads the jail \
can use.'),

msgqqueued_placeholder: T('msgqqueued'),
msgqqueued_tooltip: T('Define the number of queued SysV messages allowed for \
the jail.'),

msgqsize_placeholder: T('msgqsize'),
msgqsize_tooltip: T('Define in bytes the maximum SysV message queue size for \
the jail.'),

nmsgq_placeholder: T('nmsgq'),
nmsgq_tooltip: T('Define the maximum number of SysV message queues.'),

nsemop_placeholder: T('nsemop'),
nsemop_tooltip: T('Define the number of SysV semaphores modified in a single \
<a \
href="https://www.freebsd.org/cgi/man.cgi?query=semop&sektion=2&manpath=FreeBSD+11.1-RELEASE+and+Ports" \
target="_blank">semop(2)</a> call.'),

nshm_placeholder: T('nshm'),
nshm_tooltip: T('Enter the number of SysV shared memory segments.'),

shmsize_placeholder: T('shmsize'),
shmsize_tooltip: T('Define in bytes the number of SysV shared memory segments.'),

wallclock_placeholder: T('wallclock'),
wallclock_tooltip: T('Define in seconds the wallclock time.'),
}
