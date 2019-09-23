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
    validation: [Validators.required]
  },

  client_id_amazon_cloud_drive: {
    placeholder: T("Amazon Application Client ID"),
    tooltip: T(
      'Client ID for the <a\
 href="https://developer.amazon.com/docs/amazon-drive/ad-get-started.html"\
 target="_blank">Amazon Drive account</a>.'
    )
  },

  client_secret_amazon_cloud_drive: {
    placeholder: T("Application Client Secret"),
    tooltip: T("Client secret for the Amazon Drive account.")
  },

  access_key_id_s3: {
    placeholder: T("Access Key ID"),
    tooltip: T(
      'Amazon Web Services Key ID. This is found\
 on <a href="https://aws.amazon.com/"\
 target="_blank">Amazon AWS</a> by going through <i>My\
 account -> Security Credentials -> Access Keys\
 (Access Key ID and Secret Access Key)</i>.'
    )
  },

  secret_access_key_s3: {
    placeholder: T("Secret Access Key"),
    tooltip: T(
      "Amazon Web Services password. If the Secret Access Key\
 cannot be found or remembered, go to <i>My Account >\
 Security Credentials > Access Keys</i> and create a\
 new key pair."
    )
  },

  advanced_s3: {
    placeholder: T('Advanced Settings')
  },

  endpoint_s3: {
    placeholder: T("Endpoint URL"),
    tooltip: T(
      '<a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html"\
 target="_blank">S3 API endpoint URL</a>. When using AWS, the endpoint\
 field can be left empty to use the default endpoint for the region.\
 Available buckets are automatically fetched.<br>\
 Refer to the AWS Documentation for a list of\
 <a href="https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints"\
 target="_blank">Simple Storage Service Website Endpoints</a>.'
    )
  },

  skip_region_s3: {
    placeholder: T("Disable Endpoint Region"),
    tooltip: T(
      "Skip automatic detection of the Endpoint URL\
 region. Set this when configuring a custom\
 Endpoint URL."
    )
  },

  signatures_v2_s3: {
    placeholder: T("Use Signature Version 2"),
    tooltip: T(
      'Force using <a href="https://docs.aws.amazon.com/general/latest/gr/signature-version-2.html"\
 target="_blank">Signature Version 2</a> to sign API\
 requests. Set this when configuring a custom\
 Endpoint URL.'
    )
  },

  account_b2: {
    placeholder: T("Key ID"),
    tooltip: T('Alphanumeric
<a href="https://www.backblaze.com/b2/cloud-storage.html" \
target="_blank">Backblaze B2</a> Application Key ID. To \
generate a new application key, log in to the Backblaze account, \
go to the <i>App Keys</i> page, and add a new application key. \
Copy the application <i>keyID</i> string to this field.'),
  },

  key_b2: {
    placeholder: T("Application Key"),
    tooltip: T(''),
  },

  token_box: {
    placeholder: T("Access Token"),
    tooltip: T(
      'A User Access Token for <a\
 href="https://developer.box.com/"\
 target="_blank">Box</a>. An <a\
 href="https://developer.box.com/reference#token"\
 target="_blank">access token</a> enables Box to verify\
 a request belongs to an authorized session. Example\
 token: <i>T9cE5asGnuyYCCqIZFoWjFHvNbvVqHjl</i>.'
    )
  },

  token_dropbox: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Access Token for a Dropbox account. A <a\
 href="https://blogs.dropbox.com/developers/2014/05/generate-an-access-token-for-your-own-account/"\
 target="_blank">token must be generated</a> in the\
 account before adding it here.'
    )
  },

  host_ftp: {
    placeholder: T("Host"),
    tooltip: T("FTP Host to connect to. Example: <i>ftp.example.com</i>.")
  },

  port_ftp: {
    placeholder: T("Port"),
    tooltip: T(
      "FTP Port number. Leave blank to use a default port\
 of <i>21</i>."
    )
  },

  user_ftp: {
    placeholder: T("Username"),
    tooltip: T(
      "A username on the FTP Host system. This user must\
 already exist on the FTP Host."
    )
  },

  pass_ftp: {
    placeholder: T("Password"),
    tooltip: T("Password for the username.")
  },

  preview_google_cloud_storage: {
    placeholder: T("Preview JSON Service Account Key"),
    tooltip: T("View the contents of the Service Account JSON file.")
  },

  service_account_credentials_google_cloud_storage: {
    placeholder: T("Service Account"),
    tooltip: T(
      'Upload the Service Account JSON credential file. This <a\
 href="https://cloud.google.com/storage/docs/authentication#generating-a-private-key"\
 target="_blank">file must be generated</a> with the\
 Google Cloud Platform Console and uploaded from the\
 local system.'
    )
  },

  token_google_drive: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Token created with <a\
 href="https://developers.google.com/drive/api/v3/about-auth"\
 target="_blank">Google Drive</a>. Access Tokens expire\
 periodically and must be refreshed.'
    )
  },

  team_drive_google_drive: {
    placeholder: T("Team Drive ID"),
    tooltip: T(
      "Only needed when connecting to a Team Drive. The ID of\
 the top level folder of the Team Drive."
    )
  },

  url_http: {
    placeholder: T("URL"),
    tooltip: T("URL of the HTTP host to connect to.")
  },

  token_hubic: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Access Token <a\
 href="https://api.hubic.com/sandbox/"\
 target="_blank">generated by a Hubic account</a>.'
    )
  },

  user_mega: {
    placeholder: T("Username"),
    tooltip: T(
      'Username for a <a href="https://mega.nz/"\
 target="_blank">MEGA</a> account.'
    )
  },

  pass_mega: {
    placeholder: T("Password"),
    tooltip: T(
      'Password for the <a href="https://mega.nz/"\
 target="_blank">MEGA</a> account.'
    )
  },

  account_azureblob: {
    placeholder: T("Account Name"),
    tooltip: T(
      'Name of a <a\
 href="https://docs.microsoft.com/en-us/azure/storage/common/storage-create-storage-account"\
 target="_blank">Microsoft Azure</a> account.'
    )
  },

  key_azureblob: {
    placeholder: T("Account Key"),
    tooltip: T("Base64 encoded key for the Azure account.")
  },

  token_onedrive: {
    placeholder: T("Access Token"),
    tooltip: T(
      'Microsoft Onedrive <a\
 href="https://docs.microsoft.com/en-us/onedrive/developer/rest-api/getting-started/authentication"\
 target="_blank">Access Token</a>.'
    )
  },

  drive_type_onedrive: {
    placeholder: T("Drive Account Type"),
    tooltip: T(
      'Choose a <i>Drive Account Type</i>: <i>PERSONAL, BUSINESS,</i>\
 or <a\
 href="https://products.office.com/en-us/sharepoint/collaboration"\
 target="_blank">SharePoint</a> <i>DOCUMENT_LIBRARY</i>.'
    )
  },

  drive_id_onedrive: {
    placeholder: T("Drive ID"),
    tooltip: T(
      'Choose a unique drive identifier. Open the\
 <i>Shell</i>, enter <i>rclone config</i>,\
 and follow the prompts to find the <i>Drive ID</i>.\
 The rclone <a\
 href="https://rclone.org/onedrive"\
 target="_blank">OneDrive documentation</a> walks through\
 the configuration process.'
    )
  },

  token_pcloud: {
    placeholder: T("Access Token"),
    tooltip: T(
      '<a\
 href="https://docs.pcloud.com/methods/intro/authentication.html"\
 target="_blank">pCloud Access Token</a>. These tokens\
 can expire and require extension.'
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

  key_file_sftp: {
    placeholder: T("PEM-encoded private key file path"),
    tooltip: T(
      'Path to an unencrypted <a\
 href="https://en.wikipedia.org/wiki/Privacy-Enhanced_Mail"\
 target="_blank">PEM-encoded</a> private key file.\
 Example: <i>/home/$USER/.ssh/id_rsa</i>. Leave blank\
 to use <i>ssh-agent</i>.'
    )
  },

  url_webdav: {
    placeholder: T("URL"),
    tooltip: T("URL of the HTTP host to connect to.")
  },

  vendor_webdav: {
    placeholder: T("WebDAV service"),
    tooltip: T("Name of the WebDAV site, service, or software being\
 used.")
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
      'Yandex <a\
 href="https://tech.yandex.com/direct/doc/dg-v4/concepts/auth-token-docpage/"\
 target="_blank">Access Token</a>.'
    )
  }
};
