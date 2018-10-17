import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
    provider_placeholder : T('Provider'),
    provider_tooltip: T('Several providers are supported. If a provider is\
                    not listed, select <i>Custom Provider</i> and\
                    enter the information in the <i>Custom Server</i>\
                    and <i>Custom Path</i> fields.'),
    provider_options : [
          {label :'dyndns@3322.org',  value :'3322.org'},
          {label :'default@changeip.com',  value :'changeip.com'},
          {label :'default@cloudxns.net',  value :'cloudxns.net'},
          {label :'default@ddnss.de',  value :'ddnss.de'},
          {label :'default@dhis.org',  value :'dhis.org'},
          {label :'default@dnsexit.com',  value :'dnsexit.com'},
          {label :'default@dnsomatic.com',  value :'dnsomatic.com'},
          {label :'default@dnspod.cn',  value :'dnspod.cn'},
          {label :'default@domains.google.com',  value :'domains.google.com'},
          {label :'default@dtdns.com',  value :'dtdns.com'},
          {label :'default@duckdns.org',  value :'duckdns.org'},
          {label :'default@duiadns.net',  value :'duiadns.net'},
          {label :'default@dyndns.org',  value :'dyndns.org'},
          {label :'default@dynsip.org',  value :'dynsip.org'},
          {label :'default@dynv6.com',  value :'dynv6.com'},
          {label :'default@easydns.com',  value :'easydns.com'},
          {label :'default@freedns.afraid.org',  value :'freedns.afraid.org'},
          {label :'default@freemyip.com',  value :'freemyip.com'},
          {label :'default@gira.de',  value :'gira.de'},
          {label :'ipv6tb@he.net',  value :'he.net'},
          {label :'default@ipv4.dynv6.com',  value :'ipv4.dynv6.com'},
          {label :'default@loopia.com',  value :'loopia.com'},
          {label :'default@no-ip.com',  value :'no-ip.com'},
          {label :'ipv4@nsupdate.info',  value :'nsupdate.info'},
          {label :'default@ovh.com',  value :'ovh.com'},
          {label :'default@sitelutions.com',  value :'sitelutions.com'},
          {label :'default@spdyn.de',  value :'spdyn.de'},
          {label :'default@strato.com',  value :'strato.com'},
          {label :'default@tunnelbroker.net', value : 'tunnelbroker.net'},
          {label :'default@tzo.com',  value :'tzo.com'},
          {label :'default@zerigo.com', value : 'zerigo.com'},
          {label :'default@zoneedit.com', value : 'zoneedit.com'},
          {label :'custom', value : 'Custom Provider'},
        ],

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
            [ Validators.minLength(8), matchOtherValidator('password2'), Validators.required ],

    password2_placeholder : T('Confirm Password'),

    period_placeholder : T('Update Period'),
    period_tooltip: T('How often the IP is checked in seconds.')
}