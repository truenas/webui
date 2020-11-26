import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";
import { regexValidator } from '../../pages/common/entity/entity-form/validators/regex-validation';

export const helptext_system_cloudcredentials = {
  fieldset_basic: T('Name and Provider'),
  fieldset_authentication: T('Authentication'),
  fieldset_authentication_advanced: T('Authentication Advanced Options'),
  fieldset_endpoint_advanced_options: T('Endpoint Advanced Options'),
  fieldset_oauth_advanced_options: T('OAuth Advanced Options'),

  add_tooltip: T('Add Cloud Credential'),

  name: {
    placeholder: T("Name"),
    tooltip: T("Enter a name for the new credential."),
    validation: [Validators.required]
  },

  provider: {
    placeholder: T("Provider"),
    tooltip: T("Third-party Cloud service providers. Choose a provider \
 to configure connection credentials."),
    validation: [Validators.required]
  },

  client_id: {
    placeholder: T('OAuth Client ID'),
    tooltip: T(''),
  },

  client_secret: {
    placeholder: T('OAuth Client Secret'),
    tooltip: T(''),
  },

  access_key_id_s3: {
    placeholder: T("Access Key ID"),
    tooltip: T(
      'Amazon Web Services Key ID. This is found on \
 <a href="https://aws.amazon.com/" target="_blank">Amazon AWS</a> by \
 going through <i>My account -> Security Credentials -> Access Keys \
 (Access Key ID and Secret Access Key)</i>. Must be alphanumeric and \
 between 5 and 20 characters.'
    )
  },

  secret_access_key_s3: {
    placeholder: T("Secret Access Key"),
    tooltip: T(
      "Amazon Web Services password. If the Secret Access Key cannot be \
 found or remembered, go to <i>My Account -> Security Credentials -> \
 Access Keys</i> and create a new key pair. Must be alphanumeric and \
 between 8 and 40 characters."
    )
  },

  max_upload_parts_s3: {
    placeholder: T('Maximum Upload Parts'),
    tooltip: T('Define the maximum number of chunks for a multipart upload. This can \
 be useful if a service does not support the 10,000 chunk AWS S3 specification.'),
    validation: [regexValidator(/^\d+$/)]
  },

  endpoint_s3: {
    placeholder: T("Endpoint URL"),
    tooltip: T('<a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html" \
 target="_blank">S3 API endpoint URL</a>. When using AWS, the endpoint \
 field can be empty to use the default endpoint for the region, and \
 available buckets are automatically fetched. Refer to the AWS \
 Documentation for a list of \
 <a href="https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints \
 target="_blank">Simple Storage Service Website Endpoints</a>.'
    )
  },

  region_s3: {
    placeholder: T("Region"),
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
    placeholder: T("Disable Endpoint Region"),
    tooltip: T(
      "Skip automatic detection of the Endpoint URL region. Set this \
 when configuring a custom Endpoint URL."
    )
  },

  signatures_v2_s3: {
    placeholder: T("Use Signature Version 2"),
    tooltip: T(
      'Force using \
 <a href="https://docs.aws.amazon.com/general/latest/gr/signature-version-2.html" \
 target="_blank">Signature Version 2</a> to sign API requests. Set this \
 when configuring a custom Endpoint URL.'
    )
  },

  account_b2: {
    placeholder: T("Key ID"),
    tooltip: T('Alphanumeric \
<a href="https://www.backblaze.com/b2/cloud-storage.html" \
target="_blank">Backblaze B2</a> Application Key ID. To \
generate a new application key, log in to the Backblaze account, \
go to the <i>App Keys</i> page, and add a new application key. \
Copy the application <i>keyID</i> string to this field.'),
  },

  key_b2: {
    placeholder: T("Application Key"),
    tooltip: T('<a href="https://www.backblaze.com/b2/cloud-storage.html" \
target="_blank">Backblaze B2</a> Application Key. To generate \
a new application key, log in to the Backblaze account, go to the \
<i>App Keys</i> page, and add a new application key. Copy the \
<i>applicationKey</i> string to this field.'),
  },

  token_box: {
    placeholder: T("Access Token"),
    tooltip: T(
      'A User Access Token for <a href="https://developer.box.com/" \
 target="_blank">Box</a>. An \
 <a href="https://developer.box.com/reference#token" \
 target="_blank">access token</a> enables Box to verify a request \
 belongs to an authorized session. Example token: \
 <i>T9cE5asGnuyYCCqIZFoWjFHvNbvVqHjl</i>.'
    )
  },

  token_dropbox: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Access Token for a Dropbox account. A \
 <a href="https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/" \
 target="_blank">token must be generated</a> by the \
 <a href="https://www.dropbox.com/" target="_blank">Dropbox account</a> \
 before adding it here.'
    )
  },

  host_ftp: {
    placeholder: T("Host"),
    tooltip: T("FTP Host to connect to. Example: <i>ftp.example.com</i>.")
  },

  port_ftp: {
    placeholder: T("Port"),
    tooltip: T(
      "FTP Port number. Leave blank to use the default port <i>21</i>."
    )
  },

  user_ftp: {
    placeholder: T("Username"),
    tooltip: T(
      "A username on the FTP Host system. This user must already exist \
 on the FTP Host."
    )
  },

  pass_ftp: {
    placeholder: T("Password"),
    tooltip: T("Password for the user account.")
  },

  preview_google_cloud_storage: {
    placeholder: T("Preview JSON Service Account Key"),
    tooltip: T("Contents of the uploaded Service Account JSON file.")
  },

  service_account_credentials_google_cloud_storage: {
    placeholder: T("Service Account"),
    tooltip: T(
      'Upload a Google \
 <a href="https://rclone.org/googlecloudstorage/#service-account-support" \
 target="_blank">Service Account credential file</a>. The file is \
 created with the \
 <a href="https://console.cloud.google.com/apis/credentials" \
 target="_blank">Google Cloud Platform Console</a>.'
    ),
    validation: [Validators.required],
  },

  token_google_drive: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Token created with \
 <a href="https://developers.google.com/drive/api/v3/about-auth"\
 target="_blank">Google Drive</a>. Access Tokens expire periodically and \
 must be refreshed.'
    )
  },

  team_drive_google_drive: {
    placeholder: T("Team Drive ID"),
    tooltip: T(
      "Only needed when connecting to a Team Drive. The ID of the top \
 level folder of the Team Drive."
    )
  },

  url_http: {
    placeholder: T("URL"),
    tooltip: T("HTTP host URL.")
  },

  token_hubic: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Access Token <a href="https://api.hubic.com/sandbox/" \
 target="_blank">generated by a Hubic account</a>.'
    )
  },

  user_mega: {
    placeholder: T("Username"),
    tooltip: T(
      '<a href="https://mega.nz/" target="_blank">MEGA</a> account \
 username.'
    )
  },

  pass_mega: {
    placeholder: T("Password"),
    tooltip: T(
      '<a href="https://mega.nz/" target="_blank">MEGA</a> account \
 password.'
    )
  },

  account_azureblob: {
    placeholder: T("Account Name"),
    tooltip: T(
      '<a href="https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account" \
 target="_blank">Microsoft Azure</a> account name.'
    )
  },

  key_azureblob: {
    placeholder: T("Account Key"),
    tooltip: T("Base64 encoded key for the Azure account.")
  },

  token_onedrive: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Microsoft Onedrive \
 <a href="https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/authentication" \
 target="_blank">Access Token</a>. Log in to the Microsoft account to \
 add an access token.'
    )
  },

  drives_onedrive: {
    placeholder: T("Drives List"),
    tooltip: T('Drives and IDs registered to the Microsoft account. \
 Selecting a drive also fills the <i>Drive ID</i> field.')
  },

  drive_type_onedrive: {
    placeholder: T("Drive Account Type"),
    tooltip: T(
      'Type of Microsoft acount. Logging in to a Microsoft account \
 automatically chooses the correct account type.'
    )
  },

  drive_id_onedrive: {
    placeholder: T("Drive ID"),
    tooltip: T(
      'Unique drive identifier. Log in to a Microsoft account and choose \
 a drive from the <i>Drives List</i> drop-down to add a valid ID.'
    )
  },

  user_openstack_swift: {
    placeholder: T('User Name'),
    tooltip: T('Openstack user name for login. This is the OS_USERNAME from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.'),
  },

  key_openstack_swift: {
    placeholder: T('API Key or Password'),
    tooltip: T('Openstack API key or password. This is the OS_PASSWORD from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.')
  },

  auth_openstack_swift: {
    placeholder: T('Authentication URL'),
    tooltip: T('Authentication URL for the server. This is the OS_AUTH_URL from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.')
  },

  user_id_openstack_swift: {
    placeholder: T('User ID'),
    tooltip: T('User ID to log in - optional - most swift systems use user and leave this blank \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  domain_openstack_swift: {
    placeholder: T('User Domain'),
    tooltip: T('User domain - optional \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  tenant_openstack_swift: {
    placeholder: T('Tenant Name'),
    tooltip: T('This is the OS_TENANT_NAME from an \
<a href="https://rclone.org/swift/#configuration-from-an-openstack-credentials-file" \
target="_blank">OpenStack credentials file</a>.')
  },

  tenant_id_openstack_swift: {
    placeholder: T('Tenant ID'),
    tooltip: T('Tenant ID - optional for v1 auth, this or tenant required otherwise \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  tenant_domain_openstack_swift: {
    placeholder: T('Tenant Domain'),
    tooltip: T('Tenant domain - optional \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  region_openstack_swift: {
    placeholder: T('Region Name'),
    tooltip: T('Region name - optional \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  storage_url_openstack_swift: {
    placeholder: T('Storage URL'),
    tooltip: T('Storage URL - optional \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  auth_token_openstack_swift: {
    placeholder: T('Auth Token'),
    tooltip: T('Auth Token from alternate authentication - optional \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },

  application_credential_id_openstack_swift: {
    placeholder: T('Application Credential ID'),
    tooltip: T('<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },
  application_credential_name_openstack_swift: {
    placeholder: T('Application Credential Name'),
    tooltip: T('<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },
  application_credential_secret_openstack_swift: {
    placeholder: T('Application Credential Secret'),
    tooltip: T('<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },
  auth_version_openstack_swift: {
    placeholder: T('AuthVersion'),
    tooltip: T('AuthVersion - optional - set to (1,2,3) if your auth URL has no version \
<a href="https://rclone.org/swift/#standard-options" target="_blank">(rclone documentation)</a>.')
  },
  endpoint_type_openstack_swift: {
    placeholder: T('Endpoint Type'),
    tooltip: T('Endpoint type to choose from the service catalogue. <i>Public</i> is recommended, see the \
<a href="https://rclone.org/swift/#standard-options" target="_blank">rclone documentation</a>.')
  },

  token_pcloud: {
    placeholder: T("Access Token"),
    tooltip: T(
      '<a href="https://docs.pcloud.com/methods/intro/authentication.html" \
 target="_blank">pCloud Access Token</a>. These tokens can expire and \
 require extension.'
    )
  },

  hostname_pcloud: {
    placeholder: T('Hostname'),
    tooltip: T('Enter the hostname to connect to.')
  },

  host_sftp: {
    placeholder: T("Host"),
    tooltip: T("SSH Host to connect to.")
  },

  port_sftp: {
    placeholder: T("Port"),
    tooltip: T(
      "SSH port number. Leave empty to use the default port\
 <i>22</i>."
    )
  },

  user_sftp: {
    placeholder: T("Username"),
    tooltip: T("SSH Username.")
  },

  pass_sftp: {
    placeholder: T("Password"),
    tooltip: T("Password for the SSH Username account.")
  },

  private_key_sftp: {
    placeholder: T("Private Key ID"),
    tooltip: T('Import the private key from an existing SSH keypair or \
 select <i>Generate New</i> to create a new SSH key for this credential.')
  },

  url_webdav: {
    placeholder: T("URL"),
    tooltip: T("URL of the HTTP host to connect to.")
  },

  vendor_webdav: {
    placeholder: T("WebDAV service"),
    tooltip: T("Name of the WebDAV site, service, or software being used.")
  },

  user_webdav: {
    placeholder: T("Username"),
    tooltip: T("WebDAV account username.")
  },

  pass_webdav: {
    placeholder: T("Password"),
    tooltip: T("WebDAV account password.")
  },

  token_yandex: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Yandex \
 <a href="https://tech.yandex.com/direct/doc/dg-v4/concepts/auth-token-docpage/" \
 target="_blank">Access Token</a>.'
    )
  },
  formTitle: T('Cloud Credentials')
};
