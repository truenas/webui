import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_general = {
  stg_fieldset_gui: T('GUI'),
  stg_fieldset_loc: T('Localization'),
  stg_fieldset_other: T('Other Options'),

  stg_guicertificate: {
    placeholder: T("GUI SSL Certificate"),
    tooltip: T('The system uses a self-signed \
 <a href="--docurl--/system.html#certificates" target="_blank">certificate</a> \
 to enable encrypted web interface connections. To change the default \
 certificate, select a different created or imported certificate.'
    ),
    validation: [Validators.required]
  },

  stg_guiaddress: {
    placeholder: T("WebGUI IPv4 Address"),
    tooltip: T(
      "Choose a recent IP address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable."
    )
  },

  stg_guiv6address: {
    placeholder: T("WebGUI IPv6 Address"),
    tooltip: T(
      "Choose a recent IPv6 address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable."
    )
  },

  stg_guiport: {
    placeholder: T("WebGUI HTTP Port"),
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
    placeholder: T("WebGUI HTTPS Port"),
    tooltip: T(
      "Allow configuring a non-standard port to access the GUI\
 over <i>HTTPS</i>."
    ),
    validation: [Validators.required]
  },

  stg_guihttpsredirect: {
    placeholder: T("WebGUI HTTP -> HTTPS Redirect"),
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

  stg_sysloglevel: {
    placeholder: T("Syslog level"),
    tooltip: T(
      "When Syslog server is defined, only logs matching this\
 level are sent."
    ),
    options: [
      {label:T('Emergency'), value:'F_EMERG'},
      {label:T('Alert'), value:'F_ALERT'},
      {label:T('Critical'), value:'F_CRIT'},
      {label:T('Error'), value:'F_ERR'},
      {label:T('Warning'), value:'F_WARNING'},
      {label:T('Notice'), value:'F_NOTICE'},
      {label:T('Info'), value:'F_INFO'},
      {label:T('Debug'), value:'F_DEBUG'},
      {label:T('Is Debug'), value:'F_IS_DEBUG'}
    ]
  },

  stg_syslogserver: {
    placeholder: T("Syslog server"),
    tooltip: T(
      "Remote syslog server DNS hostname or IP address.\
 Nonstandard port numbers can be used by adding\
 a colon and the port number to the hostname, like\
 <samp>mysyslogserver:1928</samp>. Log entries\
 are written to local logs and sent to the remote\
 syslog server."
    )
  },

  secretseed: {
    placeholder: T("Export Password Secret Seed"),
    tooltip: T('')
  },

  poolkeys: {
    placeholder: T("Export Pool Encryption Keys"),
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
      "<b>WARNING:</b> This configuration file contains system\
 passwords and other sensitive data.<br /><br /><b>WARNING:</b> SSH keys \
 in <samp>/root/.ssh</samp> are <b>NOT</b> backed up by this operation.<br />"
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
    message: T(
      '<p>The system will reboot to perform this operation!</p>\
 <p><font color="red">All passwords are reset when the \
 uploaded configuration database file was saved \
 without the Password Secret Seed. </font></p>'
    )
  },

  actions: {
    save_config: T("Save Config"),
    upload_config: T("Upload Config"),
    reset_config: T("Reset Config")
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
  }
};
