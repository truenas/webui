import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextInterfaces = {
  pending_changes_text: T('There are unapplied network interface changes that must be tested before being permanently saved. Test changes now?'),

  checkin_text: T('Test network interface changes for '),
  checkin_text_2: T(' seconds.'),

  pending_checkin_dialog_text: T('Network interface changes have been temporarily applied for testing. Keep changes permanently?\
 Changes are automatically reverted after the testing delay if they are not permanently applied.'),

  pending_checkin_text: T('Network interface settings have been temporarily changed for testing. The settings will revert to the previous configuration after {x} seconds unless SAVE CHANGES is chosen to make them permanent.'),

  commit_changes_title: T('Test Changes'),
  commit_changes_warning: T('Test network interface changes? Network connectivity can be interrupted.'),

  changes_saved_successfully: T('Network changes applied successfully.'),

  commit_button: T('Test Changes'),
  keep_button: T('Save Changes'),
  rollback_button: T('Revert Changes'),
  rollback_changes_title: T('Revert Network Interface Changes'),
  rollback_changes_warning: T('Revert interface changes? All changes that are being tested will be lost.'),
  changes_rolled_back: T('Interface changes reverted.'),
  network_reconnection_issue: T('Network Reconnection Issue'),
  network_reconnection_issue_text: T('We encountered an issue while applying the new network changes. \
 Unfortunately, we were unable to reconnect to the system after the changes were implemented. \
 As a result, we have restored the previous network configuration to ensure continued connectivity.'),

  services_restarted: {
    title: T('Attention'),
    message: T('These IP Addresses were removed: {uniqueIPs}. The listed services will be changed to listen on 0.0.0.0: {affectedServices}'),
    button: T('Continue'),
  },

  checkin_title: T('Save Changes'),
  checkin_message: T('Save network interface changes?'),
  checkin_complete_title: T('Changes Saved'),
  checkin_complete_message: T('Network interface changes have been made permanent.'),
  checkin_button: T('Save'),
  go_to_network: T('Go To Network Settings'),

  pending_changes_title: T('Pending Network Changes'),
  pending_changes_message: T('There are pending network interface changes. Review them now?'),

  ha_enabled_edit_title: T('Cannot Edit while HA is Enabled'),
  ha_enabled_edit_msg: T('Editing interfaces while HA is enabled is not allowed.'),

  ha_enabled_delete_msg: T('Deleting interfaces while HA is enabled is not allowed.'),
  ha_enabled_reset_msg: T('Resetting interfaces while HA is enabled is not allowed.'),

  ha_enabled_text: T('Cannot edit while HA is enabled.'),
  go_to_ha: T('Go to HA settings'),

  delete_dialog_text: T('This change can interrupt connectivity and must be tested before making permanent. '),
};
