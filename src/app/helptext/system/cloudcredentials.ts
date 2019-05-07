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

  endpoint_s3: {
    placeholder: T("Endpoint URL"),
    tooltip: T(
      'Leave blank when using AWS. The available buckets are fetched \
 dynamically. Enter a \
 <a href="https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteEndpoints.html"\
 target="_blank">Endpoint URL</a> if not using AWS. URL \
 general format: <i>bucket-name.s3-website.region.amazonaws.com</i>.\
 Refer to the AWS Documentation for a list of <a\
 href="https://docs.aws.amazon.com/general/latest/gr/rande.html#s3_website_region_endpoints"\
 target="_blank">Simple Storage Service Website\
 Endpoints</a>.'
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
    placeholder: T("Account ID or Application Key ID"),
    tooltip: T(
      'Alphanumeric <a\
 href="https://www.backblaze.com/b2/cloud-storage.html"\
 target="_blank">Backblaze B2</a> ID. Find an Account ID\
 or applicationKeyID by logging in to the account,\
 clicking <i>Buckets</i>, and clicking\
 <i>Show Account ID and Application Key</i>. Enter the\
 <i>Account ID</i> to associate the entire account or\
 generate a new <i>Application Key</i>. The <i>keyID</i>\
 replaces the Account ID and the key string is used in\
 place of the <i>Master Application Key</i>.'
    )
  },

  key_b2: {
    placeholder: T("Master Application Key or Application Key"),
    tooltip: T(
      'Backblaze B2 Application Key. Log in to\
 the B2 account and generate a key on the Buckets\
 page. <a\
 href="https://help.backblaze.com/hc/en-us/articles/224991568-Where-can-I-find-my-Account-ID-and-Application-Key-"\
 target="_blank">Generating a new Master Application Key</a>\
 will invalidate the existing Master key and require\
 updating this field. Using a limited permissions\
 Application Key also requires changing the\
 <i>Account ID</i> to the new <i>keyID</i>.'
    )
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

  private_key_sftp: {
    placeholder: T("Private Key ID"),
    tooltip: T('Import the private key from an existing SSH keypair.\
 Choose the name of the SSH keypair to use for this connection.')
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
