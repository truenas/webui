import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_cloudcredentials = {
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
    )
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
 target="_blank">Access Token</a>.'
    )
  },

  drives_onedrive: {
    placeholder: T("Drives List"),
    tooltip: T('')
  },

  drive_type_onedrive: {
    placeholder: T("Drive Account Type"),
    tooltip: T(
      'Choose the account type: <i>PERSONAL</i>, <i>BUSINESS</i>, or \
 <a href="https://products.office.com/en-us/sharepoint/collaboration"\
 target="_blank">SharePoint</a> <i>DOCUMENT_LIBRARY</i>.'
    )
  },

  drive_id_onedrive: {
    placeholder: T("Drive ID"),
    tooltip: T(
      'Unique drive identifier. Log in to the \
 <a href="https://onedrive.live.com" target="_blank">OneDrive account</a> \
 and copy the string that appears in the browser address bar after \
 <i>cid=</i>. Example: https://onedrive.live.com/?id=root&cid=<i>12A34567B89C10D1</i>.'
    )
  },

  token_pcloud: {
    placeholder: T("Access Token"),
    tooltip: T(
      '<a href="https://docs.pcloud.com/methods/intro/authentication.html" \
 target="_blank">pCloud Access Token</a>. These tokens can expire and \
 require extension.'
    )
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
  }
};
