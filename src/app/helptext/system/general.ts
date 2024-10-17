import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemGeneral = {
  fieldset_gui: T('GUI'),
  fieldset_other: T('Other Options'),

  ui_certificate: {
    label: T('GUI SSL Certificate'),
    tooltip: T('The system uses a self-signed certificate \
 to enable encrypted web interface connections. To change \
 the default certificate, select a different certificate \
 that was created or imported in the <b>Certificates</b> menu.'),
  },

  ui_address: {
    label: T('Web Interface IPv4 Address'),
    tooltip: T(
      'Choose a recent IP address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable.',
    ),
  },

  ui_v6address: {
    label: T('Web Interface IPv6 Address'),
    tooltip: T(
      'Choose a recent IPv6 address to limit the usage when\
 accessing the administrative GUI. The built-in HTTP\
 server binds to the wildcard address of <i>0.0.0.0</i>\
 (any address) and issues an alert if the specified\
 address becomes unavailable.',
    ),
  },

  ui_port: {
    label: T('Web Interface HTTP Port'),
    tooltip: T(
      'Allow configuring a non-standard port to access the GUI\
 over <i>HTTP</i>. Changing this setting might require\
 changing a <a\
 href="https://support.mozilla.org/en-US/kb/connection-settings-firefox"\
 target="_blank">Firefox configuration setting</a>.',
    ),
  },

  ui_httpsport: {
    label: T('Web Interface HTTPS Port'),
    tooltip: T(
      'Allow configuring a non-standard port to access the GUI\
 over <i>HTTPS</i>.',
    ),
  },

  ui_httpsprotocols: {
    label: T('HTTPS Protocols'),
    tooltip: T('Cryptographic protocols for securing client/server connections. Select which\
 <a href="https://en.wikipedia.org/wiki/Transport_Layer_Security" target="_blank">Transport Layer Security (TLS)</a>\
 versions TrueNAS can use for connection security.'),
  },

  ui_httpsredirect: {
    label: T('Web Interface HTTP -> HTTPS Redirect'),
    tooltip: T(
      'Redirect <i>HTTP</i> connections to <i>HTTPS</i>. A \
 <i>GUI SSL Certificate</i> is required for <i>HTTPS</i>. Activating \
 this also sets the <a \
 href="https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security" \
 target="_blank">HTTP Strict Transport Security (HSTS)</a> maximum age \
 to <i>31536000</i> seconds (one year). This means that after a \
 browser connects to the web interface for the first time, the browser \
 continues to use HTTPS and renews this setting every year.',
    ),
  },

  stg_language: {
    placeholder: T('Language'),
    tooltip: T('Select a language from the drop-down menu.'),
    hint: T('Languages other than <i>English</i> are provided by \
     the community and may be incomplete. \
     <a href="https://github.com/truenas/webui/blob/master/TRANSLATING.md" target="_blank">Learn how to contribute.</a>'),
  },

  stg_kbdmap: {
    placeholder: T('Console Keyboard Map'),
    tooltip: T('Select a keyboard layout.'),
  },

  stg_timezone: {
    placeholder: T('Timezone'),
    tooltip: T('Select a time zone.'),
  },

  date_format: {
    placeholder: T('Date Format'),
    tooltip: T('Choose a date format.'),
  },

  time_format: {
    placeholder: T('Time Format'),
    tooltip: T('Choose a time format.'),
  },

  usage_collection: {
    label: T('Usage collection'),
    tooltip: T('Enable sending anonymous usage statistics to iXsystems.'),
  },

  ui_consolemsg: {
    label: T('Show Console Messages'),
    tooltip: T('Display console messages in real time at the bottom of the browser.'),
  },

  save_config_form: {
    message: T(
      '<b>WARNING:</b> The configuration file contains\
 sensitive data like system passwords. However, SSH keys that are stored\
 in <samp>/root/.ssh</samp> are <b>NOT</b> backed up by this operation.\
 Additional sensitive information can be included in the configuration file.<br />',
    ),
    warning: T(
      '<p>Including the Password Secret Seed allows using this\
 configuration file with a new boot device. This also\
 decrypts all system passwords for reuse when the\
 configuration file is uploaded.</p>\
 <br /><b>Keep the configuration file safe and protect it\
 from unauthorized access!</b>',
    ),
  },

  upload_config_form: {
    message: T(
      '<p>The system will restart to perform this operation!</p>\
 <p><font color="red">All passwords are reset when the \
 uploaded configuration database file was saved \
 without the Password Secret Seed. </font></p>',
    ),
  },

  reset_config_form: {
    title: T('Reset Configuration'),
    button_text: T('Reset Config'),
    message: T('Reset system configuration to default settings. The system \
 will restart to complete this operation. You will be required to reset your password.'),
  },

  redirect_confirm_title: T('Enable HTTPS Redirect'),
  redirect_confirm_message: T('Enabling redirect will require all URLs served from current\
 host to be served via HTTPS regardless of port used. This may make some App portals\
 inaccessible if they don\'t use HTTPS. Do you wish to continue?'),

  dialog_confirm_title: T('Restart Web Service'),
  dialog_confirm_message: T('The web service must restart for the protocol changes to take effect. The UI will be temporarily unavailable. Restart the service?'),

  dialog_error_title: T('Error restarting web service'),

  enabled: T('Enabled'),
  disabled: T('Disabled'),
  default: T('Default'),
  localeTitle: T('Localization'),
  guiTitle: T('GUI'),
  guiPageTitle: T('GUI Settings'),
  ntpTitle: T('NTP Servers'),
};
