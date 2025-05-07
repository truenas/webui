import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextServiceNfs = {
  bindipTooltip: T('Select IP addresses to listen to for NFS requests.\
 Leave empty for NFS to listen to all available addresses. \
 Static IPs need to be configured on the interface to appear on the list.'),

  serversTooltip: T('Enter an optimal number of threads used\
 by the kernel NFS server.'),

  serversAutoTooltip: T('Automatically sets number of threads used\
 by the kernel NFS server.'),

  allowNonrootTooltip: T('Set only if required by the NFS client. Set to allow\
 serving non-root mount requests.'),

  v4DomainTooltip: T('If set, the value will be used to override the default DNS domain name for NFSv4.\
 Specifies the "Domain" idmapd.conf setting.'),

  protocolsTooltip: T('Enable server support for NFSv3 or NFSv4 or both NFSv3 and NFSv4 clients.'),

  v4KrbTooltip: T('Set to force NFS shares to fail if the Kerberos ticket\
 is unavailable.'),

  mountdPortTooltip: T('Enter a port to bind <a\
 href="https://man7.org/linux/man-pages/man8/mountd.8.html"\
 target="_blank">mountd(8)</a>.'),

  rpcstatdPortTooltip: T('Enter a port to bind <a\
 href="https://man7.org/linux/man-pages/man8/statd.8.html"\
 target="_blank">rpc.statd(8)</a>.'),

  rpclockdPortTooltip: T('Enter a port to bind <a\
 href="https://linux.die.net/man/8/rpc.lockd"\
 target="_blank">rpc.lockd(8)</a>.'),

  userdManageGids: T('Enable server-side management of group memberships. \
 This option allows the server to determine group IDs based on server-side lookups rather than relying solely on the information provided by the NFS client. \
 This can support more than 16 groups and provide more accurate group memberships.'),
};
