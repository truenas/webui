import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextIpa = {
  targetServerTooltip: T('The name of the IPA server that TrueNAS uses to build URLs when it joins or leaves the IPA domain. \
Example: "ipa.example.internal".'),
  hostnameTooltip: T('Hostname of TrueNAS server to register in IPA during the join process. Example: "truenasnyc".'),
  domainTooltip: T('The domain of the IPA server. Example: "ipa.internal".'),
  basednTooltip: T('The base DN to use when performing LDAP operations. Example: "dc=example,dc=internal".'),
  validateCertificatesTooltip: T('If False, TrueNAS does not validate certificates from the remote LDAP server. It is better to use \
valid certificates or import them into the TrueNAS server\'s trusted certificate store.'),
  useDefaultSmbDomainTooltip: T('Use default SMB domain settings detected during IPA join. Settings for the IPA SMB domain are \
automatically detected by TrueNAS during the domain join process. Some IPA domains may not include SMB schema configuration.'),
  smbDomainNameTooltip: T('Short name for the domain. This should match the NetBIOS domain name for Active Directory domains. \
It may be null if the domain is configured as the base idmap for Active Directory.'),
  smbDomainDomainNameTooltip: T('Name of the SMB domain as defined in the IPA configuration for the IPA domain to which TrueNAS is joined.'),
  smbDomainRangeLowTooltip: T('The lowest UID or GID that the idmap backend can assign.'),
  smbDomainRangeHighTooltip: T('The highest UID or GID that the idmap backend can assign.'),
  smbDomainDomainSidTooltip: T('The domain SID for the IPA domain to which TrueNAS is joined.'),
};
