import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  bindip_tooltip: T('Enter the IP address which runs the \
 S3 service. <i>0.0.0.0</i> tells the server to listen \
 on all addresses.'),

  bindport_tooltip: T('Enter the TCP port which provides the S3 service.'),

  access_key_tooltip: T('Enter the S3 access ID. See \
<a href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys" target="_blank"> \
 Access keys</a> for more information.'),

  secret_key_tooltip: T('Enter the S3 secret access key. See \
 <a href="https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys" target="_blank"> \
 Access keys</a> for more information.'),

  storage_path_tooltip: T('Browse to the directory for the S3 filesystem.'),

  browser_tooltip: T('Set to enable the web user interface for the S3 service. \
 Access the minio web interface by entering the IP address and port number \
 separated by a colon in the browser address bar.'),

  certificate_tooltip: T('Use an SSL certificate that was created or imported in \
 <b>System > Certificates</b> for secure S3 connections.'),

  path_warning_title: T('Warning'),
  path_warning_msg: T('Selecting a dataset to use with Minio <strong>removes all existing\
 permissions for the dataset and any nested directories!</strong> Permissions are reset\
 to minio:minio. To avoid dataset permissions conflicts, please create a separate,\
 dedicated dataset for Minio.'),
};
