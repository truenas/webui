import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextNetworkConfiguration = {
  title: T('Edit Global Configuration'),

  hostname_placeholder: T('Hostname'),
  hostname_tooltip: T('System hostname.'),

  hostname_b_placeholder: T('Hostname (TrueNAS Controller 2)'),
  hostname_b_tooltip: T('Host name of second TrueNAS controller.'),

  hostname_virtual_placeholder: T('Hostname (Virtual)'),
  hostname_virtual_tooltip: T('When using a virtual host, this is also \
 used as the Kerberos principal name.'),

  inherit_dhcp_placeholder: T('Inherit domain from DHCP'),
  inherit_dhcp_tooltip: T('When this checkbox is checked, domain is inherited from DHCP.'),

  domain_placeholder: T('Domain'),
  domain_tooltip: T('System domain name, like <i>example.com</i>'),

  domains_placeholder: T('Additional Domains'),
  domains_tooltip: T('Additional domains to search. Separate entries by \
 pressing <code>Enter</code>. Adding search domains can cause slow DNS \
 lookups.'),

  ipv4gateway_placeholder: T('IPv4 Default Gateway'),
  ipv4gateway_tooltip: T('Enter an IPv4 address. This overrides the default\
 gateway provided by DHCP.'),

  ipv6gateway_placeholder: T('IPv6 Default Gateway'),
  ipv6gateway_tooltip: T('Enter an IPv6 address. This overrides the default\
 gateway provided by DHCP.'),

  nameserver1_placeholder: T('Nameserver 1'),
  nameserver1_tooltip: T('Primary DNS server.'),

  nameserver2_placeholder: T('Nameserver 2'),
  nameserver2_tooltip: T('Secondary DNS server.'),

  nameserver3_placeholder: T('Nameserver 3'),
  nameserver3_tooltip: T('Third DNS server.'),

  httpproxy_placeholder: T('HTTP Proxy'),
  httpproxy_tooltip: T('When using a proxy, enter the proxy information for \
 the network in the format <i>http://my.proxy.server:3128</i> or \
 <i>http://user:password@my.proxy.server:3128</i>'),

  hosts_placeholder: T('Host Name Database'),
  hosts_tooltip: T('Additional hosts to be appended to <i>/etc/hosts</i>.\
 Separate entries by pressing <code>Enter</code>. Hosts defined here are \
 still accessible by name even when DNS is not available. See \
 <a href="https://man7.org/linux/man-pages/man5/hosts.5.html" target="_blank">hosts(5)</a> \
 for additional information.'),

  hostname_and_domain: T('Hostname and Domain'),
  gateway: T('Default Gateway'),
  nameservers: T('DNS Servers'),
  outbound_network: T('Outbound Network'),
  outbound_activity: T('Outbound Activity'),
  other: T('Other Settings'),
  service_announcement: T('Service Announcement'),

  netbios_placeholder: 'NetBIOS-NS',
  netbios_tooltip: T('Legacy NetBIOS name server. Advertises the SMB \
 service <i>NetBIOS Name</i>. Can be required for legacy SMB1 clients \
 to discover the server. When advertised, the server appears in \
 <i>Network Neighborhood</i>).'),

  mdns_placeholder: 'mDNS',
  mdns_tooltip: T('Multicast DNS. Uses the system <i>Hostname</i> to \
 advertise enabled and running services. For example, this controls if \
 the server appears under <i>Network</i> on MacOS clients.'),

  wsd_placeholder: 'WS-Discovery',
  wsd_tooltip: T('Uses the SMB Service <i>NetBIOS Name</i> to advertise \
 the server to WS-Discovery clients. This causes the computer appear in \
 the <i>Network Neighborhood</i> of modern Windows OSes.'),

  outbound_network_activity: {
    allow: {
      placeholder: T('Allow All'),
      tooltip: T('Any system service can communicate externally.'),
    },
    deny: {
      placeholder: T('Deny All'),
      tooltip: T('This system cannot communicate externally.'),
    },
    specific: {
      placeholder: T('Allow Specific'),
      tooltip: T('Define the system services that are allowed to \
communicate externally. All other external traffic is restricted.'),
    },
  },
  outbound_network_value: {
    placeholder: T('Allowed Services'),
    tooltip: T('Select the system services that will be allowed to \
communicate externally.'),
  },
};
