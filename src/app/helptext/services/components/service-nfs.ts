import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceNfs = {
  nfs_srv_bindip_tooltip: T('Select IP addresses to listen to for NFS requests.\
 Leave empty for NFS to listen to all available addresses. \
 Static IPs need to be configured on the interface to appear on the list.'),

  nfs_srv_servers_tooltip: T('Enter an optimal number of threads used\
 by the kernel NFS server.'),

  nfs_srv_servers_auto_tooltip: T('Automatically sets number of threads used\
 by the kernel NFS server.'),

  nfs_srv_allow_nonroot_tooltip: T('Set only if required by the NFS client. Set to allow\
 serving non-root mount requests.'),

  nfs_srv_v4_domain_tooltip: T('If set, the value will be used to override the default DNS domain name for NFSv4.\
 Specifies the "Domain" idmapd.conf setting.'),

  nfs_srv_protocols_tooltip: T('Enable server support for NFSv3 or NFSv4 or both NFSv3 and NFSv4 clients.'),

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

  userd_manage_gids: T('Enable server-side management of group memberships. \
 This option allows the server to determine group IDs based on server-side lookups rather than relying solely on the information provided by the NFS client. \
 This can support more than 16 groups and provide more accurate group memberships.'),

  nfs_srv_mountd_log_tooltip: T('Set to log <a\
 href="https://man7.org/linux/man-pages/man8/mountd.8.html"\
 target="_blank">mountd(8)</a> syslog requests.'),

  nfs_srv_statd_lockd_log_tooltip: T('Set to log <a\
 href="https://man7.org/linux/man-pages/man8/statd.8.html"\
 target="_blank">rpc.statd(8)</a> and <a\
 href="https://linux.die.net/man/8/rpc.lockd"\
 target="_blank">rpc.lockd(8)</a> syslog requests.'),
};
