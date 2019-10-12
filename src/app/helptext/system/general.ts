import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_general = {

  stg_guicertificate: {
    placeholder: T("GUI SSL Certificate"),
    tooltip: T('Required for <i>HTTPS</i>. Browse to the location of\
 the certificate to use for encrypted connections. If\
 there are no certificates, create a <a\
 href="--docurl--/system.html#cas"\
 target="_blank">Certificate Authority (CA)</a> then\
 the <a href="--docurl--/system.html#certificates"\
 target="_blank">Certificate</a>.'
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
      "Check this to redirect <i>HTTP</i> connections to\
 <i>HTTPS</i>. A <i>GUI SSL Certificate</i> must be selected."
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
    )
  },

  stg_syslogserver: {
    placeholder: T("Syslog server"),
    tooltip: T(
      "Define an <i>IP address or hostname:optional_port_number</i>\
 to send logs. When set, log entries write to both the\
 console and remote server."
    )
  },

  secretseed: {
    placeholder: T("Export Password Secret Seed"),
    tooltip: T('')
  },

  poolkeys: {
    placeholder: T("Export Pool Ecryption Keys"),
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
    tooltip: T("Enable sending anonymous usage statistics to iXsystems")
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
    ui_address: T("When 0.0.0.0 has been selected, selection of other addresses is not allowed."),
    ui_v6address: T("When :: has been selected, selection of other addresses is not allowed.")
  }
};
