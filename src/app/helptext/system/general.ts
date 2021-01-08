import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_general = {
  stg_fieldset_gui: T('GUI'),
  stg_fieldset_loc: T('Localization'),
  stg_fieldset_other: T('Other Options'),

  stg_guicertificate: {
    placeholder: T("GUI SSL Certificate"),
    tooltip: T('The system uses a self-signed certificate \
 to enable encrypted web interface connections. To change \
 the default certificate, select a different certificate \
 that was created or imported in the <b>Certificates</b> menu.'
    ),
    validation: [Validators.required]
  },

  stg_guiaddress: {
    placeholder: T("Web Interface IPv4 Address"),
    tooltip: T(
      "Choose a recent IP address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable."
    )
  },

  stg_guiv6address: {
    placeholder: T("Web Interface IPv6 Address"),
    tooltip: T(
      "Choose a recent IPv6 address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable."
    )
  },

  stg_guiport: {
    placeholder: T("Web Interface HTTP Port"),
    tooltip: T(
      'Allow configuring a non-standard port to access the GUI\
 over <i>HTTP</i>. Changing this setting might require\
 changing a <a\
 href="https://www.redbrick.dcu.ie/~d_fens/articles/Firefox:_This_Address_is_Restricted"\
 target="_blank">Firefox configuration setting</a>.'
    ),
    validation: [Validators.required]
  },

  stg_guihttpsport: {
    placeholder: T("Web Interface HTTPS Port"),
    tooltip: T(
      "Allow configuring a non-standard port to access the GUI\
 over <i>HTTPS</i>."
    ),
    validation: [Validators.required]
  },

  stg_guihttpsprotocols: {
    placeholder: T("HTTPS Protocols"),
    tooltip: T('Cryptographic protocols for securing client/server connections. Select which\
 <a href="https://en.wikipedia.org/wiki/Transport_Layer_Security" target="_blank">Transport Layer Security (TLS)</a>\
 versions TrueNAS can use for connection security.'),
  },

  stg_guihttpsredirect: {
    placeholder: T("Web Interface HTTP -> HTTPS Redirect"),
    tooltip: T(
      'Redirect <i>HTTP</i> connections to <i>HTTPS</i>. A \
 <i>GUI SSL Certificate</i> is required for <i>HTTPS</i>. Activating \
 this also sets the <a \
 href="https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security" \
 target="_blank">HTTP Strict Transport Security (HSTS)</a> maximum age \
 to <i>31536000</i> seconds (one year). This means that after a \
 browser connects to the web interface for the first time, the browser \
 continues to use HTTPS and renews this setting every year.'
    )
  },

  stg_language: {
    placeholder: T("Language"),
    tooltip: T("Select a language from the drop-down menu.")
  },

  stg_language_sort_label: T('Sort languages by:'),
  stg_language_sort_name: T('Name'),
  stg_language_sort_code: T('Language code'),

  stg_kbdmap: {
    placeholder: T("Console Keyboard Map"),
    tooltip: T("Select a keyboard layout.")
  },

  stg_timezone: {
    placeholder: T("Timezone"),
    tooltip: T("Select a time zone.")
  },

  date_format: {
    placeholder: T('Date Format'),
    tooltip: T('Choose a date format.')
  },

  time_format: {
    placeholder: T('Time Format'),
    tooltip: T('Choose a time format.')
  },

  secretseed: {
    placeholder: T("Export Password Secret Seed"),
    tooltip: T('')
  },

  crash_reporting: {
    placeholder: T("Crash reporting"),
    tooltip: T("Send failed HTTP request data which can include client\
 and server IP addresses, failed method call tracebacks, and\
 middleware log file contents to iXsystems.")
  },

  usage_collection: {
    placeholder: T("Usage collection"),
    tooltip: T("Enable sending anonymous usage statistics to iXsystems.")
  },

  save_config_form: {
    title: T('Save Configuration'),
    message: T(
      "<b>WARNING:</b> The configuration file contains\
 sensitive data like system passwords. However, SSH keys that are stored\
 in <samp>/root/.ssh</samp> are <b>NOT</b> backed up by this operation.\
 Additional sensitive information can be included in the configuration file.<br />"
    ),
    button_text: T("Save"),
    warning: T(
      "<p>Including the Password Secret Seed allows using this\
 configuration file with a new boot device. This also\
 decrypts all system passwords for reuse when the\
 configuration file is uploaded.</p>\
 <br /><b>Keep the configuration file safe and protect it\
 from unauthorized access!</b>"
    ),
    host_key_warning: T(''),
  },


  upload_config: { placeholder: T("Select Configuration File") },

  upload_config_form: {
    title: T('Upload Config'),
    button_text: T("Upload"),
    tooltip: T('Browse to the locally saved configuration file.'),
    validation: [Validators.required],
    message: T(
      '<p>The system will reboot to perform this operation!</p>\
 <p><font color="red">All passwords are reset when the \
 uploaded configuration database file was saved \
 without the Password Secret Seed. </font></p>'
    )
  },

  actions: {
    config_button: T('Manage Configuration'),
    save_config: T("Download File"),
    upload_config: T("Upload File"),
    reset_config: T("Reset to Defaults")
  },

  reset_config_placeholder: T('Confirm'),

  reset_config_form: {
    title: T('Reset Configuration'),
    button_text: T("Reset Config"),
    message: T('Reset system configuration to default settings. The system \
 will restart to complete this operation. You will be required to reset your password.'),
  },

  dialog_confirm_title: T("Restart Web Service"),

  dialog_confirm_message: T(
    "The web service must restart \
 for the protocol changes to take effect. The UI will be \
 temporarily unavailable. Restart the service?"
  ),

  dialog_error_title: T("Error restarting web service"),

  snackbar_download_success: {
    title: T("Download Sucessful"),
    action: T("Success")
  },

  validation_errors: {
    ui_address: T("Select <samp>0.0.0.0</samp> to include all addresses. When this has been chosen, additional addresses cannot be selected."),
    ui_v6address: T("Select <samp>::</samp> to include all addresses. When this has been chosen, additional addresses cannot be selected.")
  },

  config_download: {
    failed_title: T("Error Downloading File"),
    failed_message: T("Config could not be downloaded")
  },

  config_upload: {
    title: T('Upload Config'),
    message: T('Uploading...')
  },
  enabled: T('Enabled'),
  disabled: T('Disabled'),
  default: T('Default'),
  localeTitle: T('Localization'),
  guiTitle: T('GUI'),
  guiPageTitle: T('GUI Settings'),
  ntpTitle: T('NTP Servers'),
  supportTitle: T('Support'),
  deleteServer: {
    title: T('Delete Server'),
    message: T('Delete')
  }
};
