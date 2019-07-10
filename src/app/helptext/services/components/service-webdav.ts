import { T } from '../../../translate-marker';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
protocol_placeholder : T('Protocol'),
protocol_tooltip : T('<i>HTTP</i> will keep the connection unencrypted.\
 <i>HTTPS</i> encrypts the connection.\
 <i>HTTP+HTTPS</i> allows both types of connections.'),
protocol_options : [
  {label : 'HTTP', value : 'HTTP'},
  {label : 'HTTPS', value : 'HTTPS'},
  {label : 'HTTP+HTTPS', value : 'HTTPHTTPS'},
],

tcpport_placeholder : T('HTTP Port'),
tcpport_tooltip : T('Specify a port for unencrypted connections. The\
 default port <i>8080</i> is recommended. Do not reuse\
 a port.'),

tcpportssl_placeholder : T('HTTPS Port'),
tcpportssl_tooltip : T('Specify a port for encrypted connections. The\
 default port <i>8081</i> is recommended. Do not reuse\
 a port.'),

certssl_placeholder : T('Webdav SSL Certificate'),
certssl_tooltip : T('Select the <a href="--docurl--/system.html#certificates"\
 target="_blank">SSL certificate</a> to use for\
 encrypted connections.'),
certssl_options: [
  {label: '---', value: null}
],

htauth_placeholder : T('HTTP Authentication'),
htauth_tooltip : T('<i>Basic Authentication</i> is unencrypted.\
 <i>Digest Authentication</i> is encrypted.'),
htauth_options : [
  {label : 'No Authentication', value: 'NONE'},
  {label : 'Basic Authentication', value : 'BASIC'},
  {label : 'Digest Authentication', value : 'DIGEST'},
],

password_placeholder : T('Webdav Password'),
password_tooltip : T('The default of <i>davtest</i> is recommended to\
 change. <i>davtest</i> is a known value.'),
password_validation : [ matchOtherValidator('password2') ],

password2_placeholder : T('Confirm Password')
}