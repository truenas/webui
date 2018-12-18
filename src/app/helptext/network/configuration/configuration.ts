import { T } from '../../../translate-marker';

export default {

gc_hostname_placeholder : T('Hostname'),
gc_hostname_tooltip : T('System hostname.'),

gc_domain_placeholder : T('Domain'),
gc_domain_tooltip : T('System domain name, like <i>example.com</i>'),

gc_domains_placeholder: T('Additional Domains'),
gc_domains_tooltip : T('Additional space-delimited domains to search.\
 Adding search domains can cause slow DNS lookups.'),

gc_ipv4gateway_placeholder : T('IPv4 Default Gateway'),
gc_ipv4gateway_tooltip : T('Enter an IPv4 address. This overrides the default\
 gateway provided by DHCP.'),

gc_ipv6gateway_placeholder : T('IPv6 Default Gateway'),
gc_ipv6gateway_tooltip : T('Enter an IPv6 address. This overrides the default\
 gateway provided by DHCP.'),

gc_nameserver1_placeholder : T('Nameserver 1'),
gc_nameserver1_tooltip : T('Primary DNS server.'),

gc_nameserver2_placeholder : T('Nameserver 2'),
gc_nameserver2_tooltip : T('Secondary DNS server.'),

gc_nameserver3_placeholder : T('Nameserver 3'),
gc_nameserver3_tooltip : T('Third DNS server'),

gc_httpproxy_placeholder : T('HTTP Proxy'),
gc_httpproxy_tooltip : T('Enter the proxy information for the network. Example:\
 <i>http://my.proxy.server:3128</i> or\
 <i>http://user:password@my.proxy.server:3128</i>'),

gc_netwait_enabled_placeholder : T('Enable netwait feature'),
gc_netwait_enabled_tooltip : T('Set to delay the start of network-reliant services\
 until ICMP packets to a destination in the <i>netwait\
 IP list</i> are flowing.'),
gc_netwait_ip_placeholder : T('Netwait IP list'),
gc_netwait_ip_tooltip : T('Enter a space-delimited list of IP addresses to <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=ping"\
 target="_blank">ping(8)</a>. Each address is tried\
 until one is successful or the list is exhausted.\
 Leave empty to use the default gateway.'),

gc_hosts_placeholder : T('Host name database'),
gc_hosts_tooltip : T('Additional hosts to be appended to <i>/etc/hosts</i>\
 can be added here. Each host entry is a single line\
 with whitespace-delimited IP address, hostname, and\
 any aliases. Hosts defined here are still accessible\
 by name even when DNS is not available. See <a\
 href="https://www.freebsd.org/cgi/man.cgi?query=hosts"\
 target="_blank">hosts(5)</a> for additional information.'),
}