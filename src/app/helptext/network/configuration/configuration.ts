import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNetworkConfiguration = {
  title: T('Edit Global Configuration'),

  hostnameLabel: T('Hostname'),

  bHostnameLabel: T('Hostname (TrueNAS Controller 2)'),

  hostnameVirtualLabel: T('Hostname (Virtual)'),
  hostnameVirtualTooltip: T('When using a virtual host, this is also \
 used as the Kerberos principal name.'),

  inheritDhcpPlaceholder: T('Inherit domain from DHCP'),

  domainLabel: T('Domain'),
  domainTooltip: T('System domain name, like <i>example.com</i>'),

  domainsLabel: T('Additional Domains'),
  domainsTooltip: T('Additional domains to search. Separate entries by \
 pressing <code>Enter</code>. Adding search domains can cause slow DNS \
 lookups.'),

  ipv4gatewayLabel: T('IPv4 Default Gateway'),
  ipv4gatewayTooltip: T('Enter an IPv4 address. This overrides the default\
 gateway provided by DHCP.'),

  ipv6gatewayLabel: T('IPv6 Default Gateway'),
  ipv6gatewayTooltip: T('Enter an IPv6 address. This overrides the default\
 gateway provided by DHCP.'),

  nameserver1Label: T('Primary'),
  nameserver2Label: T('Secondary'),
  nameserver3Label: T('Tertiary'),

  httpproxyLabel: T('HTTP Proxy'),
  httpproxyTooltip: T('When using a proxy, enter the proxy information for \
 the network in the format <i>http://my.proxy.server:3128</i> or \
 <i>http://user:password@my.proxy.server:3128</i>'),

  hostsLabel: T('Host Name Database'),
  hostsTooltip: T('Additional hosts to be appended to <i>/etc/hosts</i>.\
 Separate entries by pressing <code>Enter</code>. Hosts defined here are \
 still accessible by name even when DNS is not available. See \
 <a href="https://man7.org/linux/man-pages/man5/hosts.5.html" target="_blank">hosts(5)</a> \
 for additional information.'),

  hostnameAndDomain: T('Hostname and Domain'),
  gateway: T('Default Gateway'),
  nameservers: T('DNS Servers'),
  outboundNetwork: T('Outbound Network'),
  outboundActivity: T('Outbound Activity'),
  other: T('Other Settings'),
  serviceAnnouncement: T('Service Announcement'),

  netbiosLabel: 'NetBIOS-NS',
  netbiosTooltip: T('Legacy NetBIOS name server. Advertises the SMB \
 service <i>NetBIOS Name</i>. Can be required for legacy SMB1 clients \
 to discover the server. When advertised, the server appears in \
 <i>Network Neighborhood</i>).'),

  mdnsLabel: 'mDNS',
  mdnsTooltip: T('Multicast DNS. Uses the system <i>Hostname</i> to \
 advertise enabled and running services. For example, this controls if \
 the server appears under <i>Network</i> on MacOS clients.'),

  wsdLabel: 'WS-Discovery',
  wsdTooltip: T('Uses the SMB Service <i>NetBIOS Name</i> to advertise \
 the server to WS-Discovery clients. This causes the computer appear in \
 the <i>Network Neighborhood</i> of modern Windows OSes.'),

  outboundNetworkActivity: {
    allow: {
      label: T('Allow All'),
      tooltip: T('Any system service can communicate externally.'),
    },
    deny: {
      label: T('Deny All'),
      tooltip: T('This system cannot communicate externally.'),
    },
    specific: {
      label: T('Allow Specific'),
      tooltip: T('Define the system services that are allowed to \
communicate externally. All other external traffic is restricted.'),
    },
  },
  outboundNetworkValue: {
    label: T('Allowed Services'),
    tooltip: T('Select the system services that will be allowed to \
communicate externally.'),
  },
};
