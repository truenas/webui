import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInterfaces = {
  pendingChangesText: T('There are unapplied network interface changes that must be tested before being permanently saved. Test changes now?'),

  checkinText: T('Test network interface changes for '),
  checkinText2: T(' seconds.'),

  pendingCheckinDialogText: T('Network interface changes have been temporarily applied for testing. Keep changes permanently?\
 Changes are automatically reverted after the testing delay if they are not permanently applied.'),

  pendingCheckinText: T('Network interface settings have been temporarily changed for testing. The settings will revert to the previous configuration after {x} seconds unless SAVE CHANGES is chosen to make them permanent.'),

  commitChangesTitle: T('Test Changes'),
  commitChangesWarning: T('Test network interface changes? Network connectivity can be interrupted.'),

  commitButton: T('Test Changes'),
  commitAndOpenUiButton: T('Test and Open UI'),
  keepButton: T('Save Changes'),
  revertChangesButton: T('Revert Changes'),
  revertChangesTitle: T('Revert Network Interface Changes'),
  revertChangesWarning: T('Revert interface changes? All changes that are being tested will be lost.'),
  changesRolledBack: T('Interface changes reverted.'),
  networkReconnectionIssue: T('Network Reconnection Issue'),
  networkReconnectionIssueText: T('We encountered an issue while applying the new network changes. \
 Unfortunately, we were unable to reconnect to the system after the changes were implemented. \
 As a result, we have restored the previous network configuration to ensure continued connectivity.'),

  servicesRestarted: {
    title: T('Attention'),
    message: T('These IP Addresses were removed: {uniqueIPs}. The listed services will be changed to listen on 0.0.0.0: {affectedServices}'),
    button: T('Continue'),
  },

  checkinTitle: T('Save Changes'),
  checkinMessage: T('Save network interface changes?'),
  checkinCompleteMessage: T('Network interface changes have been made permanent.'),

  ipAddressChangedHeading: T('System IP Address Will Change'),
  ipAddressChangedMessage: T('The pending changes will modify the IP address used to access this system. After testing, use the new address to save your changes.'),
  checkinButton: T('Save'),
  goToNetwork: T('Go To Network Settings'),

  pendingChangesTitle: T('Pending Network Changes'),
  pendingChangesMessage: T('There are pending network interface changes. Review them now?'),

  haEnabledEditMessage: T('Editing interfaces while HA is enabled is not allowed.'),

  haEnabledDeleteMessage: T('Deleting interfaces while HA is enabled is not allowed.'),
  haEnabledResetMessage: T('Changing interfaces while HA is enabled is not allowed.'),

  haEnabledText: T('Cannot edit while HA is enabled.'),
  goToHa: T('Go to HA settings'),

  deleteDialogText: T('This change can interrupt connectivity and must be tested before making permanent. '),

  uiAccessLossHeading: T('UI Access Will Be Lost'),
  uiAccessLossMessage: T('The pending network changes will remove all IP addresses that the UI is currently bound to. You will lose access to the UI after committing these changes. Go to General Settings to update the UI address configuration, or revert these changes.'),
};
