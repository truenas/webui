import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
provider_placeholder : T('Provider'),
provider_tooltip: T('Several providers are supported. If a specific \
 provider is not listed, select <i>Custom Provider</i> and enter the \
 information in the <i>Custom Server</i> and <i>Custom Path</i> fields.'),

checkip_ssl_placeholder : T('CheckIP Server SSL'),
checkip_ssl_tooltip: T('Use HTTPS for the connection to the \
 <b>CheckIP Server</b>.'),

checkip_server_placeholder : T('CheckIP Server'),
checkip_server_tooltip: T('Name and port of the server that reports the \
 external IP address. For example, entering <i>checkip.dyndns.org:80</i> \
 uses \
 <a href="https://help.dyn.com/remote-access-api/checkip-tool/" target="_blank">Dyn IP detection</a>. \
 to discover the remote socket IP address.'),

checkip_path_placeholder : T('CheckIP Path'),
checkip_path_tooltip: T('Path to the <b>CheckIP Server</b>. For example, \
 <i>no-ip.com</i> uses a <b>CheckIP Server</b> of \
 <i>dynamic.zoneedit.com</i> and <b>CheckIP Path</b> of \
 <i>/checkip.html</i>.'),

ssl_placeholder : T('SSL'),
ssl_tooltip: T('Use HTTPS for the connection to the server that updates \
 the DNS record.'),

custom_ddns_server_placeholder: T('Custom Server'),
custom_ddns_server_tooltip: T('DDNS server name. For example, \
 <i>members.dyndns.org</i> denotes a server similar to dyndns.org.'),

custom_ddns_path_placeholder: T('Custom Path'),
custom_ddns_path_tooltip: T('DDNS server path. Path syntax varies by \
 provider and must be obtained from that provider. For example, \
 <i>/update?hostname=</i> is a simple path for the \
 <i>update.twodns.de</i> <b>Custom Server</b>. The hostname is \
 automatically appended by default. More examples are in the \
 <a href="https://github.com/troglobit/inadyn#custom-ddns-providers" target="_blank">In-A-Dyn documentation</a>.'),

domain_placeholder : T('Domain name'),
domain_tooltip: T('Fully qualified domain name of the host with the \
 dynamic IP address. Separate multiple domains with a space, comma \
 \(,\), or semicolon \(;\). Example: \
 <i>myname.dyndns.org; myothername.dyndns.org</i>.'),

username_placeholder : T('Username'),
username_tooltip: T('Username for logging in to the provider and \
 updating the record.'),

password_placeholder : T('Password'),
password_tooltip: T('Password for logging in to the provider and \
 updating the record.'),
password_validation :
        [ Validators.minLength(8), matchOtherValidator('password2') ],

password2_placeholder : T('Confirm Password'),

period_placeholder : T('Update Period'),
period_tooltip: T('How often the IP is checked in seconds.')
}
