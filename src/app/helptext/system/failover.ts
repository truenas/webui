import { T } from "app/translate-marker";
import globalHelptext from '../../helptext/global-helptext';

export const helptext_system_failover = {
  save_button_text: T('SAVE'),
  failover_button_text: T('SAVE AND FAILOVER'),
  dialog_initiate_failover_title: T("Initiate Failover"),
  dialog_initiate_failover_message: T("WARNING: A failover will \
 temporarily interrupt system services."),
  dialog_initiate_failover_checkbox: T(`Confirm`),
  dialog_initiate_cancel: T('Cancel'),
  dialog_initiate_action: T('Failover'),

  dialog_sync_to_peer_title: T("Sync to Peer"),
  dialog_sync_to_peer_message: T("Are you sure you want to sync to peer?"),

  dialog_sync_to_peer_checkbox: T(`Reboot standby ${globalHelptext.ctrlr}`),
  dialog_button_ok: T('Proceed'),

  dialog_sync_from_peer_title: T("Sync from Peer"),
  dialog_sync_from_peer_message: T("Are you sure you want to sync from peer?"),

  confirm_dialogs: {
    sync_title: T('Success'),
    sync_from_message: T("Sync from peer succeeded."),
    sync_to_message: T("Sync to peer succeeded."),
  },

  disabled_placeholder: T('Disable Failover'),
  disabled_tooltip: T('Disable automatic failover.'),

  master_placeholder: T(`Default ${globalHelptext.ctrlr}`),
  master_tooltip: T(`Make the currently active ${globalHelptext.ctrlr} \
 the default when both ${globalHelptext.ctrlr}s are online and HA is \
 enabled. To change the default ${globalHelptext.ctrlr}, unset this \
 option on the default ${globalHelptext.ctrlr} and allow the system to \
 fail over. This briefly interrupts system services.`),

  timeout_placeholder: T('Network Timeout Before Initiating Failover'),
  timeout_tooltip: T('Number of seconds to wait after a network failure \
 before triggering a failover. <i>0</i> means a failover occurs \
 immediately, or after two seconds when the system is using a link \
 aggregation.'),

  master_dialog_title: T('Confirm Failover'),
  master_dialog_warning: T(`Forcing the other ${globalHelptext.ctrlr} to \
 become active requires a failover. This will temporarily interrupt \
 system services. After confirmation, <b>SAVE AND FAILOVER</b> must \
 be clicked on the previous screen.`),

  fieldset_title: T('Failover Configuration')
};
