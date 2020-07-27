import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import { regexValidator } from '../../../pages/common/entity/entity-form/validators/regex-validation';
import { matchOtherValidator } from '../../../pages/common/entity/entity-form/validators/password-validation';

export default {
bindip_placeholder : T('IP Address'),
bindip_tooltip: T('Enter the IP address which runs the \
 S3 service. <i>0.0.0.0</i> tells the server to listen \
 on all addresses.'),
bindip_options : [
 {label:'0.0.0.0', value: '0.0.0.0'}
],

bindport_placeholder : T('Port'),
bindport_tooltip: T('Enter the TCP port which provides the S3 service.'),
bindport_value: '9000',
bindport_validation: [Validators.min(1), Validators.max(65535), Validators.required, Validators.pattern(/^[1-9]\d*$/)],

access_key_placeholder : T('Access Key'),
access_key_tooltip: T('Enter the S3 access ID. See \
<a href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys" target="_blank"> \
 Access keys</a> for more information.'),
access_key_validation: [Validators.minLength(5), Validators.maxLength(20), Validators.required,
 regexValidator(/^\w+$/)],

secret_key_placeholder : T('Secret Key'),
secret_key_tooltip: T('Enter the S3 secret access key. See \
 <a href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys" target="_blank"> \
 Access keys</a> for more information.'),
secret_key_validation: [Validators.minLength(8), Validators.maxLength(40), 
  regexValidator(/^\w+$/)],

secret_key2_placeholder : T('Confirm Secret Key'),
secret_key2_validation : [ matchOtherValidator('secret_key'), Validators.required,
  regexValidator(/^\w+$/)],

storage_path_placeholder : T('Disk'),
storage_path_tooltip: T('Browse to the directory for the S3 filesystem.'),
storage_path_validation: [ Validators.required],

browser_placeholder : T('Enable Browser'),
browser_tooltip: T('Set to enable the web user interface for the S3 service. \
 Access the minio web interface by entering the IP address and port number \
 separated by a colon in the browser address bar.'),
mode_placeholder : 'Mode',
mode_options : [
  {label : 'local'}
],

certificate_placeholder : T('Certificate'),
certificate_tooltip : T('Use an SSL certificate that was created or imported in \
 <b>System > Certificates</b> for secure S3 connections.'),

fieldset_title: T('Configuration Options'),

path_warning_title : T('Warning'),
path_warning_msg: T('Selecting a dataset to use with Minio <strong>removes all existing\
 permissions for the dataset and any nested directories!</strong> Permissions are reset\
 to minio:minio. To avoid dataset permissions conflicts, please create a separate,\
 dedicated dataset for Minio.'),

 formTitle: T('S3')

}