import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextDirectoryServices = {
  serviceTypeTooltip: T('Select the type of directory service configuration to set up.'),
  enableTooltip: T('Enable the directory service. If TrueNAS has never joined the specified domain (IPA or Active Directory), \
setting this to True causes TrueNAS to attempt to join the domain. NOTE: The domain join process for Active Directory and IPA \
will make changes to the domain such as creating a new computer account for the TrueNAS server and creating DNS records for TrueNAS.'),
  enableAccountCacheTooltip: T('Enable backend caching for user and group lists. If enabled, then directory services users and groups will be \
presented as choices in the UI dropdowns and in API responses for user and group queries. This setting also \
controls whether users and groups appear in getent results. Disable this setting to reduce load on the directory \
server when necessary.'),
  enableDnsUpdatesTooltip: T('Enable automatic DNS updates for the TrueNAS server in the domain via nsupdate and gssapi / TSIG.'),
  timeoutTooltip: T('The timeout value for DNS queries that are performed as part of the join process and NETWORK_TIMEOUT for LDAP \
requests.'),
  kerberosRealmTooltip: T('Name of kerberos realm used for authentication to the directory service. If set to null, then Kerberos \
is not used for binding to the directory service. When joining an Active Directory or IPA domain for the first \
time, the realm is detected and configured automatically if not specified.'),
};
