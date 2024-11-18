import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

export const helptextTopbar = {
  ha_status: T('HA Status'),
  ha_status_text_enabled: T('HA Enabled'),
  ha_is_enabled: T('HA is enabled'),
  ha_status_text_disabled: T('HA Disabled'),
  updateRunning_dialog: {
    title: T('Update in Progress'),
    message: helptextGlobal.sysUpdateMessage,
    message_pt2: `<b>${helptextGlobal.sysUpdateMessagePt2}</b>`,
  },

  mat_tooltips: {
    toggle_collapse: T('Toggle Collapse'),
    tc_connect: T('Connecting to TrueCommand'),
    tc_status: T('Status of TrueCommand'),
    update: T('Update in Progress'),
    reboot_info: T('Reboot Required'),
    pending_network_changes: T('Pending Network Changes'),
    directory_services_monitor: T('Directory Services Monitor'),
    resilvering: T('Resilvering'),
    replication: T('Replication'),
    task_manager: T('Running Jobs'),
    alerts: T('Alerts'),
    settings: T('Settings'),
    power: T('Power'),
  },

  signupDialog: {
    content: T('This allows your TrueNAS system to be monitored and administrated by\
 TrueCommand. Click <b>SIGNUP</b> to create a new TrueCommand Cloud instance or <b>CONNECT</b> to join an existing instance.'),
  },

  updateDialog: {
    title_connect: T('Connect to TrueCommand Cloud'),
    title_update: T('Update TrueCommand Settings'),
    connect_btn: T('Connect'),
    save_btn: T('Save'),
    api_placeholder: T('API Key'),
    api_tooltip: T('Enter or paste the API key provided from \
<a href="https://portal.ixsystems.com/portal/login/" target="_blank">iXsystems Account Services</a>. \
Login or signup is required.'),
    enabled_placeholder: T('Enable'),
    enabled_tooltip: T('Immediately connect to TrueCommand.'),
  },

  tcDialog: {
    title: T('Open TrueCommand User Interface'),
    message: T('<em>Warning:</em> The WireGuard service must be active on the client system to access the TrueCommand UI.'),
    confirmBtnMsg: T('Continue'),
  },

  tcDeregisterBtn: T('Deregister'),
  tcDeregisterDialog: {
    title: T('Deregister TrueCommand Cloud Service'),
    icon: iconMarker('warning'),
    message: T('Are you sure you want to deregister TrueCommand Cloud Service?'),
    confirmBtnMsg: T('Confirm'),
  },

  deregisterInfoDialog: {
    title: T('TrueCommand Cloud Service deregistered'),
    message: T('TrueCommand Cloud Service has been deregistered.'),
  },

  stopTCConnectingDialog: {
    title: T('Stop TrueCommand Cloud Connection'),
    icon: iconMarker('warning'),
    message: T('Are you sure you want to stop connecting to the TrueCommand Cloud Service?'),
    confirmBtnMsg: T('Confirm'),
  },

  checkEmailInfoDialog: {
    title: T('Verify Email Address'),
    message: T('A message with verification instructions has been sent to the new email \
address. Please verify the email address before continuing.'),
  },
  changePasswordDialog: {
    pw_new_pw_tooltip: T('Passwords cannot contain a <b>?</b>. Passwords should \
be at least eight characters and contain a mix of lower and \
upper case, numbers, and special characters.'),
    pw_invalid_title: T('Incorrect Password'),
    pw_updated: T('Password updated.'),
  },
};
