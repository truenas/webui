import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
dc_realm_label : 'Realm',
dc_realm_placeholder : T('Realm'),
dc_realm_tooltip: T('Enter a capitalized DNS realm name.'),
dc_realm_validation : [ Validators.required ],

dc_domain_label : 'Domain',
dc_domain_placeholder : T('Domain'),
dc_domain_tooltip: T('Enter a capitalized domain name.'),
dc_domain_validation : [ Validators.required ],

dc_role_label : 'Server Role',
dc_role_placeholder : T('Server Role'),
dc_role_tooltip: T('The only server role available is the domain\
 controller for a new domain.'),
dc_role_options : [
      {label : 'DC', value : 'dc'},
],

dc_dns_forwarder_label : 'DNS Forwarder',
dc_dns_forwarder_placeholder : T('DNS Forwarder'),
dc_dns_forwarder_tooltip: T('Enter the IP address of a DNS forwarder. Required for\
 recursive queries when <i>SAMBA_INTERNAL</i> is selected.'),
dc_dns_forwarder_validation : [ Validators.required ],

dc_forest_level_label : 'Domain Forest Level',
dc_forest_level_placeholder : T('Domain Forest Level'),
dc_forest_level_tooltip: T('Choices are <i>2000, 2003, 2008, 2008_R2, 2012,</i> or <i>2012_R2</i>.\
 Refer to <a\
 href="https://docs.microsoft.com/en-us/windows-server/identity/ad-ds/active-directory-functional-levels"\
 target="_blank">Understanding Active Directory Domain Services (AD DS)\
 Functional Levels</a> for more details.'),
dc_forest_level_options : [
      {label : '2000', value : '2000'},
      {label : '2003', value : '2003'},
      {label : '2008', value : '2008'},
      {label : '2008_R2', value : '2008_R2'},
      {label : '2012', value : '2012'},
      {label : '2012_R2', value : '2012_R2'},
],

dc_passwd_placeholder : T('Administrator Password'),
dc_passwd_tooltip: T('Enter the password to be used for the\
 <a href="%%docurl%%/directoryservices.html#active-directory"\
 target=”_blank”>Active Directory</a> administrator account.'),
dc_passwd_validation :
      [ Validators.minLength(8), matchOtherValidator('dc_passwd2') ],

dc_passwd2_placeholder : T('Confirm password'),

afp_srv_map_acls_label : 'Kerberos Realm:',
afp_srv_map_acls_placeholder : T('Kerberos Realm'),
afp_srv_map_acls_tooltip : T('Auto-populates with information from the <b>Realm</b>\
 when the settings in this screen are saved.'),
afp_srv_map_acls_options : [
      {label : 'Rights', value : 'rights'},
      {label : 'None', value : 'none'},
      {label : 'Mode', value : 'mode'},
],
ad_monitor_warning : T('')
}