import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';

export default {
nfs_srv_fieldset_general: T('General Options'),
nfs_srv_fieldset_v4: T('NFSv4'),
nfs_srv_fieldset_ports: T('Ports'),
nfs_srv_fieldset_other: T('Other Options'),

nfs_srv_servers_placeholder: T('Number of servers'),
nfs_srv_servers_tooltip: T('Specify how many servers to create. Increase if NFS\
 client responses are slow. Keep this less than or\
 equal to the number of CPUs reported by <b>sysctl -n\
 kern.smp.cpus</b> to limit CPU context switching.'),
nfs_srv_servers_validation : [ Validators.required ],

nfs_srv_udp_placeholder: T('Serve UDP NFS clients'),
nfs_srv_udp_tooltip: T('Set if NFS clients need to use UDP.'),

nfs_srv_bindip_placeholder: T('Bind IP Addresses'),
nfs_srv_bindip_tooltip: T('Select IP addresses to listen to for NFS requests.\
 Leave empty for NFS to listen to all available addresses.'),

nfs_srv_allow_nonroot_placeholder: T('Allow non-root mount'),
nfs_srv_allow_nonroot_tooltip: T('Set only if required by the NFS client. Set to allow\
 serving non-root mount requests.'),

nfs_srv_v4_placeholder: T('Enable NFSv4'),
nfs_srv_v4_tooltip: T('Set to switch from NFSv3 to NFSv4.'),
value: false,

nfs_srv_v4_v3owner_placeholder: T('NFSv3 ownership model for NFSv4'),
nfs_srv_v4_v3owner_tooltip: T('Set when NFSv4 ACL support is needed without requiring\
 the client and the server to sync users and groups.'),
nfs_srv_v4_v3owner_relation: [
{
action: 'DISABLE',
when: [{
name: 'v4',
value: false,
}]
}],

nfs_srv_v4_krb_placeholder: T('Require Kerberos for NFSv4'),
nfs_srv_v4_krb_tooltip: T('Set to force NFS shares to fail if the Kerberos ticket\
 is unavailable.'),

nfs_srv_mountd_port_placeholder: T('mountd(8) bind port'),
nfs_srv_mountd_port_tooltip: T('Enter a port to bind <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=mountd"\
 target="_blank">mountd(8)</a>.'),

nfs_srv_rpcstatd_port_placeholder: T('rpc.statd(8) bind port'),
nfs_srv_rpcstatd_port_tooltip: T('Enter a port to bind <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd"\
 target="_blank">rpc.statd(8)</a>.'),

nfs_srv_rpclockd_port_placeholder: T('rpc.lockd(8) bind port'),
nfs_srv_rpclockd_port_tooltip: T('Enter a port to bind <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd"\
 target="_blank">rpc.lockd(8)</a>.'),

nfs_srv_16_placeholder: T('Support >16 groups'),
nfs_srv_16_tooltip: T('Set when a user is a member of more than 16 groups.\
 This assumes group membership is configured correctly\
 on the NFS server.'),
nfs_srv_16_relation: [{
  action: 'DISABLE',
  connective: 'AND',
  when: [{
    name: 'v4',
    value: true,
    }, {
    name: 'v4_v3owner',
    value: true,
  }]
}],

nfs_srv_mountd_log_placeholder: T('Log mountd(8) requests'),
nfs_srv_mountd_log_tooltip: T('Set to log <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=mountd"\
 target="_blank">mountd(8)</a> syslog requests.'),

nfs_srv_statd_lockd_log_placeholder: T('Log rpc.statd(8) and rpc.lockd(8)'),
nfs_srv_statd_lockd_log_tooltip: T('Set to log <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=rpc.statd"\
 target="_blank">rpc.statd(8)</a> and <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=rpc.lockd"\
 target="_blank">rpc.lockd(8)</a> syslog requests.')
}