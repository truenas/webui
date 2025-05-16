import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';

export const helptextTopbar = {
  haStatus: T('HA Status'),
  tooltips: {
    toggleCollapse: T('Toggle Collapse'),
    connectingToTruecommand: T('Connecting to TrueCommand'),
    truecommandStatus: T('Status of TrueCommand'),
    tncStatus: T('Status of TrueNAS Connect'),
    update: T('Update in Progress'),
    rebootInfo: T('Reboot Required'),
    pendingNetworkChanges: T('Pending Network Changes'),
    directoryServicesMonitor: T('Directory Services Monitor'),
    resilvering: T('Resilvering'),
    replication: T('Replication'),
    taskManager: T('Running Jobs'),
    alerts: T('Alerts'),
    settings: T('Settings'),
    power: T('Power'),
  },

  signupDialog: {
    content: T('This allows your TrueNAS system to be monitored and administrated by\
 TrueCommand. Click <b>SIGNUP</b> to create a new TrueCommand Cloud instance or <b>CONNECT</b> to join an existing instance.'),
  },

  updateDialog: {
    titleConnect: T('Connect to TrueCommand Cloud'),
    titleUpdate: T('Update TrueCommand Settings'),
    connectButton: T('Connect'),
    saveButton: T('Save'),
    apiKey: T('API Key'),
    apiTooltip: T('Enter or paste the API key provided from \
<a href="https://portal.ixsystems.com/portal/login/" target="_blank">iXsystems Account Services</a>. \
Login or signup is required.'),
    enabledLabel: T('Enable'),
    enabledTooltip: T('Immediately connect to TrueCommand.'),
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
    newPasswordTooltip: T('Passwords should \
be at least eight characters and contain a mix of lower and \
upper case, numbers, and special characters.'),
    passwordUpdated: T('Password updated.'),
  },
};
