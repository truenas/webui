import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  nfs_srv_udp_tooltip: T('Set if NFS clients need to use UDP.'),

  nfs_srv_bindip_tooltip: T('Select IP addresses to listen to for NFS requests.\
 Leave empty for NFS to listen to all available addresses. \
 Static IPs need to be configured on the interface to appear on the list.'),

  nfs_srv_allow_nonroot_tooltip: T('Set only if required by the NFS client. Set to allow\
 serving non-root mount requests.'),

  nfs_srv_servers_placeholder: T('Number of servers'),

  nfs_srv_servers_tooltip: T('Specify how many servers to create. Increase if NFS\
 client responses are slow. Keep this less than or\
 equal to the number of CPUs reported by <b>sysctl -n\
 kern.smp.cpus</b> to limit CPU context switching.'),

  nfs_srv_v4_tooltip: T('Set to switch from NFSv3 to NFSv4.'),

  nfs_srv_v4_v3owner_tooltip: T('Set when NFSv4 ACL support is needed without requiring\
 the client and the server to sync users and groups.'),

  nfs_srv_v4_krb_tooltip: T('Set to force NFS shares to fail if the Kerberos ticket\
 is unavailable.'),

  nfs_srv_mountd_port_tooltip: T('Enter a port to bind <a\
 href="https://man7.org/linux/man-pages/man8/mountd.8.html"\
 target="_blank">mountd(8)</a>.'),

  nfs_srv_rpcstatd_port_tooltip: T('Enter a port to bind <a\
 href="https://man7.org/linux/man-pages/man8/statd.8.html"\
 target="_blank">rpc.statd(8)</a>.'),

  nfs_srv_rpclockd_port_tooltip: T('Enter a port to bind <a\
 href="https://linux.die.net/man/8/rpc.lockd"\
 target="_blank">rpc.lockd(8)</a>.'),

  nfs_srv_16_tooltip: T('Set when a user is a member of more than 16 groups.\
 This assumes group membership is configured correctly\
 on the NFS server.'),

  nfs_srv_mountd_log_tooltip: T('Set to log <a\
 href="https://man7.org/linux/man-pages/man8/mountd.8.html"\
 target="_blank">mountd(8)</a> syslog requests.'),

  nfs_srv_statd_lockd_log_tooltip: T('Set to log <a\
 href="https://man7.org/linux/man-pages/man8/statd.8.html"\
 target="_blank">rpc.statd(8)</a> and <a\
 href="https://linux.die.net/man/8/rpc.lockd"\
 target="_blank">rpc.lockd(8)</a> syslog requests.'),

  formTitle: T('NFS'),

  add_principal_prompt: {
    title: T('Add Kerberos SPN Entry'),
    message: T('Would you like to add a Service Principal Name (SPN) now?'),
    affirmative: T('Yes'),
    negative: T('No'),
  },
  add_principal_form: {
    username: T('Name'),
    password: T('Password'),
    action: T('Save'),
    cancel: T('Cancel'),
    error_title: T('Error'),
    error: T('There was a problem submitting the SPN entry.'),
  },

  addSPN: {
    btnTxt: T('Add NFS SPN'),
    username: T('Username'),
    pw: T('Password'),
    error: T('Error'),
    success: T('Success'),
    success_msg: T('You have successfully added credentials.'),
  },
};
