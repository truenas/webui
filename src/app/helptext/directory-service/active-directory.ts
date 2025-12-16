import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextActiveDirectory = {
  domainLeftMessage: T('You have left the domain.'),
  hostnameTooltip: T('Hostname of TrueNAS server to register in Active Directory. Example: "truenasnyc".'),
  domainNameTooltip: T('The full DNS domain name of the Active Directory domain. This must not be a domain controller. \
Example: "mydomain.internal".'),
  siteTooltip: T('The Active Directory site where the TrueNAS server is located. TrueNAS detects this automatically during the \
domain join process.'),
  computerAccountOuTooltip: T('Use this setting to override the default organizational unit (OU) in which the TrueNAS computer account is \
created during the domain join. Use it to set a custom location for TrueNAS computer accounts.'),
  defaultDomainsTooltip: T('Controls if the system removes the domain prefix from Active Directory user and group names. If enabled, users \
appear as "administrator" instead of "EXAMPLE\\administrator". In most cases, disable this (default) to avoid name \
conflicts between Active Directory and local accounts.'),
  enableTrustedDomainsTooltip: T('Enable support for trusted domains. If enabled, then separate trusted domain configuration must be set for all \
trusted domains.'),
};
