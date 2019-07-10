import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
bindip_placeholder : T('IP Address'),
bindip_tooltip: T('Enter the IP address which runs the <a\
 href="--docurl--/services.html#s3" target="_blank">S3\
 service</a>. <i>0.0.0.0</i> tells the server to listen\
 on all addresses.'),
bindip_options : [
 {label:'0.0.0.0', value: '0.0.0.0'}
],

bindport_placeholder : T('Port'),
bindport_tooltip: T('Enter the TCP port which provides the S3 service.'),
bindport_value: '9000',
bindport_validation: [Validators.min(1), Validators.max(65535), Validators.required, Validators.pattern(/^[1-9]\d*$/)],

access_key_placeholder : T('Access Key'),
access_key_tooltip: T('Enter the S3 username.'),
access_key_validation: [Validators.minLength(5), Validators.maxLength(20), Validators.required,
 regexValidator(/^\w+$/)],

secret_key_placeholder : T('Secret Key'),
secret_key_tooltip: T('Enter the password that must be used by connecting S3 systems.'),
secret_key_validation: [Validators.minLength(8), Validators.maxLength(40), Validators.required, 
  regexValidator(/^\w+$/)],

secret_key2_placeholder : T('Confirm Secret Key'),
secret_key2_validation : [ matchOtherValidator('secret_key'), Validators.required,
  regexValidator(/^\w+$/)],

storage_path_placeholder : T('Disk'),
storage_path_tooltip: T('Browse to the directory for the S3 filesystem.'),
storage_path_validation: [ Validators.required],

browser_placeholder : T('Enable Browser'),
browser_tooltip: T('Set to enable the S3 web user interface.'),

mode_placeholder : 'Mode',
mode_options : [
  {label : 'local'}
],

certificate_placeholder : T('Certificate'),
certificate_tooltip : T('Add an <a href="--docurl--/system.html#certificates"\
 target="_blank">SSL certificate</a> to be used for\
 secure S3 connections.')
}