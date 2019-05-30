import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
provider_placeholder : T('Provider'),
provider_tooltip: T('Several providers are supported. If a provider is\
 not listed, select <i>Custom Provider</i> and\
 enter the information in the <i>Custom Server</i>\
 and <i>Custom Path</i> fields.'),

checkip_ssl_placeholder : T('CheckIP Server SSL'),
checkip_ssl_tooltip: T('Set to use HTTPS for the connection to the <b>CheckIP Server</b>.'),

checkip_server_placeholder : T('CheckIP Server'),
checkip_server_tooltip: T('Enter the name and port of the server that reports the\
 external IP address. Example: <b>server.name.org:port</b>.'),

checkip_path_placeholder : T('CheckIP Path'),
checkip_path_tooltip: T('Enter the path requested by the <b>CheckIP Server</b>\
 to determine the user IP address.'),

ssl_placeholder : T('SSL'),
ssl_tooltip: T('Set to use HTTPS for the connection to the server\
 that updates the DNS record.'),

custom_ddns_server_placeholder: T('Custom Server'),
custom_ddns_server_tooltip: T('Hostname for your custom DDNS provider'),

custom_ddns_path_placeholder: T('Custom Path'),
custom_ddns_path_tooltip: T('\'%h\' will be replaced with your hostname\
 and \'%i\' will be replaced with your IP address.'),

domain_placeholder : T('Domain name'),
domain_tooltip: T('Enter a fully qualified domain name.\
 Example: <b>yourname.dyndns.org</b>'),

username_placeholder : T('Username'),
username_tooltip: T('Enter the username used to log in to the provider\
 and update the record.'),

password_placeholder : T('Password'),
password_tooltip: T('Enter the password used to log in to the provider\
 and update the record.'),
password_validation :
        [ Validators.minLength(8), matchOtherValidator('password2') ],

password2_placeholder : T('Confirm Password'),

period_placeholder : T('Update Period'),
period_tooltip: T('How often the IP is checked in seconds.')
}