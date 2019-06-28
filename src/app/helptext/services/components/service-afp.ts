import { T } from '../../../translate-marker';

export default {
afp_srv_guest_user_placeholder : T('Guest Account'),
afp_srv_guest_user_tooltip: T('Select an account to use for guest access. This\
 account must have permissions to the shared pool or dataset.\
 The privileges given to this user are also\
 available to any client connecting to the guest service.\
 This user must  exist in the password file, but does\
 not require a valid login. The root user cannot be\
 used as guest account.'),
afp_srv_guest_user_options: [
  {label : 'nobody', value : 'nobody'}
],

afp_srv_guest_placeholder : T('Guest Access'),
afp_srv_guest_tooltip: T('Set to disable the password prompt that appears\
 before clients access AFP shares.'),

afp_srv_connections_limit_placeholder : T('Max. Connections'),
afp_srv_connections_limit_tooltip: T('Maximum number of simultaneous connections permitted\
 via AFP. The default limit is 50.'),

afp_srv_dbpath_placeholder : T('Database Path'),
afp_srv_dbpath_tooltip: T('Sets the database information to be stored in the path.\
 The path must be writable even if the pool is read only.'),

afp_srv_chmod_request_placeholder : T('Chmod Request'),
afp_srv_chmod_request_tooltip: T('Indicates how to handle Access Control Lists.\
 <b>Ignore:</b> ignores requests and gives\
 the parent directory ACL inheritance full control over\
 new items.<b> Preserve:</b> preserves ZFS ACEs for named\
 users and groups or the POSIX ACL group mask.\
 <b>Simple:</b> is set to chmod() as requested\
 without any extra steps.'),
afp_srv_chmod_request_options : [
  {label : 'Ignore', value : 'ignore'},
  {label : 'Preserve', value : 'preserve'},
  {label : 'Simple', value : 'simple'},
],

afp_srv_map_acls_placeholder : T('Map ACLs'),
afp_srv_map_acls_tooltip: T('Select mapping of permissions for\
 authenticated users. <b>Rights</b>\
 (default, Unix-style permissions), <b>None</b>,\
 or <b>Mode</b> (ACLs).'),
afp_srv_map_acls_options : [
  {label : 'Rights', value : 'rights'},
  {label : 'None', value : 'none'},
  {label : 'Mode', value : 'mode'},
],

afp_srv_bindip_placeholder : T('Bind Interfaces'),
afp_srv_bindip_tooltip: T('Specify the IP addresses to listen for AFP connections.\
 If none are specified, advertise the first IP\
 address of the system, but listen for any\
 incoming request.'),

afp_srv_global_aux_placeholder : T('Global auxiliary parameters'),
afp_srv_global_aux_tooltip: T('Additional <a href="http://netatalk.sourceforge.net/3.0/htmldocs/afp.conf.5.html"\
 target="_blank">afp.conf(5)</a> parameters.')
}