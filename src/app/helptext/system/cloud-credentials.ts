import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemCloudcredentials = {
  name: {
    tooltip: T('Enter a name for the new credential.'),
  },
  provider: {
    tooltip: T('Third-party Cloud service providers. Choose a provider \
 to configure connection credentials.'),
  },
  exist_provider: {
    tooltip: T('Load an existing provider configuration.'),
  },
  client_id: {
    placeholder: T('OAuth Client ID'),
  },
  client_secret: {
    placeholder: T('OAuth Client Secret'),
  },
  access_key_id_s3: {
    tooltip: T(
      'Amazon Web Services Key ID. This is found on \
 <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html" target="_blank">Amazon AWS</a> by \
 going through <i>My account -> Security Credentials -> Access Keys \
 (Access Key ID and Secret Access Key)</i>. Must be alphanumeric and \
 between 5 and 20 characters.',
    ),
  },
  secret_access_key_s3: {
    tooltip: T(
      'Amazon Web Services password. If the Secret Access Key cannot be \
 found or remembered, go to <i>My Account -> Security Credentials -> \
 Access Keys</i> and create a new key pair. Must be alphanumeric and \
 between 8 and 40 characters.',
    ),
  },
  max_upload_parts_s3: {
    tooltip: T('Define the maximum number of chunks for a multipart upload. This can \
 be useful if a service does not support the 10,000 chunk AWS S3 specification.'),
  },
  endpoint_s3: {
    tooltip: T('<a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html" \
 target="_blank">S3 API endpoint URL</a>. When using AWS, the endpoint \
 field can be empty to use the default endpoint for the region, and \
 available buckets are automatically fetched. Refer to the AWS \
 Documentation for a list of \
 <a href="https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints" \
 target="_blank">Simple Storage Service Website Endpoints</a>.'),
  },
  region_s3: {
    tooltip: T('<a href="https://docs.aws.amazon.com/general/latest/gr/rande-manage.html" \
 target="_blank">AWS resources in a geographic area</a>. Leave empty to \
 automatically detect the correct public region for the bucket. Entering \
 a private region name allows interacting with Amazon buckets created in \
 that region. For example, enter <i>us-gov-east-1</i> to discover buckets \
 created in the eastern \
 <a href="https://docs.aws.amazon.com/govcloud-us/latest/UserGuide/whatis.html" target="_blank">AWS GovCloud</a> \
 region.'),
  },
  skip_region_s3: {
    tooltip: T(
      'Skip automatic detection of the Endpoint URL region. Set this only if AWS provider does not support regions.',
    ),
  },
  signatures_v2_s3: {
    tooltip: T(
      'Force using \
 <a href="https://docs.aws.amazon.com/general/latest/gr/signature-version-2.html" \
 target="_blank">Signature Version 2</a> to sign API requests.  Set this only \
 if your AWS provider does not support default version 4 signatures.',
    ),
  },
  account_b2: {
    tooltip: T('Alphanumeric \
<a href="https://www.backblaze.com/docs/cloud-storage-application-keys?highlight=application%20key" \
target="_blank">Backblaze B2</a> Application Key ID. To \
generate a new application key, log in to the Backblaze account, \
go to the <i>App Keys</i> page, and add a new application key. \
Copy the application <i>keyID</i> string to this field.'),
  },
  key_b2: {
    tooltip: T('<a href="https://www.backblaze.com/docs/cloud-storage-application-keys?highlight=application%20key" \
target="_blank">Backblaze B2</a> Application Key. To generate \
a new application key, log in to the Backblaze account, go to the \
<i>App Keys</i> page, and add a new application key. Copy the \
<i>applicationKey</i> string to this field.'),
  },
  token_box: {
    tooltip: T(
      'A User Access Token for <a href="https://developer.box.com/" \
 target="_blank">Box</a>. An \
 <a href="https://developer.box.com/guides/authentication/tokens/access-tokens/" \
 target="_blank">access token</a> enables Box to verify a request \
 belongs to an authorized session. Example token: \
 <i>T9cE5asGnuyYCCqIZFoWjFHvNbvVqHjl</i>.',
    ),
  },
  token_dropbox: {
    tooltip: T(
      'Access Token for a Dropbox account. A \
 <a href="https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/" \
 target="_blank">token must be generated</a> by the \
 <a href="https://www.dropbox.com/" target="_blank">Dropbox account</a> \
 before adding it here.',
    ),
  },
  host_ftp: {
    tooltip: T('FTP Host to connect to. Example: <i>ftp.example.com</i>.'),
  },
  port_ftp: {
    tooltip: T(
      'FTP Port number. Leave blank to use the default port <i>21</i>.',
    ),
  },
  user_ftp: {
    tooltip: T(
      'A username on the FTP Host system. This user must already exist \
 on the FTP Host.',
    ),
  },
  pass_ftp: {
    tooltip: T('Password for the user account.'),
  },
  preview_google_cloud_storage: {
    tooltip: T('Contents of the uploaded Service Account JSON file.'),
  },
  service_account_credentials_google_cloud_storage: {
    tooltip: T(
      'Upload a Google \
 <a href="https://rclone.org/googlecloudstorage/#service-account-support" \
 target="_blank">Service Account credential file</a>. The file is \
 created with the \
 <a href="https://console.cloud.google.com/apis/credentials" \
 target="_blank">Google Cloud Platform Console</a>.',
    ),
  },
  token_google_drive: {
    tooltip: T(
      'Token created with \
 <a href="https://developers.google.com/drive/api/v3/about-auth"\
 target="_blank">Google Drive</a>. Access Tokens expire periodically and \
 must be refreshed.',
    ),
  },
  token_google_photos: {
    tooltip: T(
      'Token created with \
 <a href="https://developers.google.com/drive/api/v3/about-auth"\
 target="_blank">Google Drive</a>.',
    ),
    oauth_tooltip: T('Photo Library API client secret generated from the \
 <a href="https://developers.google.com/identity/protocols/oauth2" target="_blank">Google API Console</a>'),
  },
  team_drive_google_drive: {
    tooltip: T(
      'Only needed when connecting to a Team Drive. The ID of the top \
 level folder of the Team Drive.',
    ),
  },
  url_http: {
    tooltip: T('HTTP host URL.'),
  },
  token_hubic: {
    tooltip: T(
      'Access Token <a href="https://api.hubic.com/sandbox/" \
 target="_blank">generated by a Hubic account</a>.',
    ),
  },
  user_mega: {
    tooltip: T(
      '<a href="https://mega.nz/" target="_blank">MEGA</a> account \
 username.',
    ),
  },
  pass_mega: {
    tooltip: T(
      '<a href="https://mega.nz/" target="_blank">MEGA</a> account \
 password.',
    ),
  },
  account_azureblob: {
    tooltip: T(
      '<a href="https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account" \
 target="_blank">Microsoft Azure</a> account name.',
    ),
  },
  key_azureblob: {
    tooltip: T('Base64 encoded key for the Azure account.'),
  },
  endpoint_azureblob: {
    tooltip: T('Example: blob.core.usgovcloudapi.net'),
  },
  token_onedrive: {
    tooltip: T(
      'Microsoft Onedrive \
 <a href="https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/authentication" \
 target="_blank">Access Token</a>. Log in to the Microsoft account to \
 add an access token.',
    ),
  },
  drives_onedrive: {
    tooltip: T('Drives and IDs registered to the Microsoft account. \
 Selecting a drive also fills the <i>Drive ID</i> field.'),
  },
  drive_type_onedrive: {
    tooltip: T(
      'Type of Microsoft acount. Logging in to a Microsoft account \
 automatically chooses the correct account type.',
    ),
  },
  drive_id_onedrive: {
    tooltip: T(
      'Unique drive identifier. Log in to a Microsoft account and choose \
 a drive from the <i>Drives List</i> drop-down to add a valid ID.',
    ),
  },
  user_openstack_swift: {
    tooltip: T('Openstack user name for login. This is the OS_USERNAME from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.'),
  },
  key_openstack_swift: {
    tooltip: T('Openstack API key or password. This is the OS_PASSWORD from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.'),
  },
  auth_openstack_swift: {
    tooltip: T('Authentication URL for the server. This is the OS_AUTH_URL from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.'),
  },
  user_id_openstack_swift: {
    tooltip: T('User ID to log in - optional - most swift systems use user and leave this blank \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  domain_openstack_swift: {
    tooltip: T('User domain - optional \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  tenant_openstack_swift: {
    tooltip: T('This is the OS_TENANT_NAME from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.'),
  },
  tenant_id_openstack_swift: {
    tooltip: T('Tenant ID - optional for v1 auth, this or tenant required otherwise \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  tenant_domain_openstack_swift: {
    tooltip: T('Tenant domain - optional \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  region_openstack_swift: {
    tooltip: T('Region name - optional \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  storage_url_openstack_swift: {
    tooltip: T('Storage URL - optional \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  auth_token_openstack_swift: {
    tooltip: T('Auth Token from alternate authentication - optional \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  application_credential_id_openstack_swift: {
    tooltip: T('<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  application_credential_name_openstack_swift: {
    tooltip: T('<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  application_credential_secret_openstack_swift: {
    tooltip: T('<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  auth_version_openstack_swift: {
    tooltip: T('AuthVersion - optional - set to (1,2,3) if your auth URL has no version \
<a href="https://rclone.org/swift/#swift-region" target="_blank">(rclone documentation)</a>.'),
  },
  endpoint_type_openstack_swift: {
    tooltip: T('Endpoint type to choose from the service catalogue. <i>Public</i> is recommended, see the \
<a href="https://rclone.org/swift/#swift-region" target="_blank">rclone documentation</a>.'),
  },
  token_pcloud: {
    tooltip: T(
      '<a href="https://docs.pcloud.com/methods/intro/authentication.html" \
 target="_blank">pCloud Access Token</a>. These tokens can expire and \
 require extension.',
    ),
  },
  hostname_pcloud: {
    tooltip: T('Enter the hostname to connect to.'),
  },
  host_sftp: {
    tooltip: T('SSH Host to connect to.'),
  },
  port_sftp: {
    tooltip: T(
      'SSH port number. Leave empty to use the default port\
 <i>22</i>.',
    ),
  },
  user_sftp: {
    tooltip: T('SSH Username.'),
  },
  pass_sftp: {
    tooltip: T('Password for the SSH Username account.'),
  },
  private_key_sftp: {
    tooltip: T('Import the private key from an existing SSH keypair or \
 select <i>Generate New</i> to create a new SSH key for this credential.'),
  },
  url_webdav: {
    tooltip: T('URL of the HTTP host to connect to.'),
  },
  vendor_webdav: {
    tooltip: T('Name of the WebDAV site, service, or software being used.'),
  },
  user_webdav: {
    tooltip: T('WebDAV account username.'),
  },
  pass_webdav: {
    tooltip: T('WebDAV account password.'),
  },
  token_yandex: {
    tooltip: T(
      'Yandex \
 <a href="https://tech.yandex.com/direct/doc/dg-v4/concepts/auth-token-docpage/" \
 target="_blank">Access Token</a>.',
    ),
  },
};
