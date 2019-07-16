import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_failover = {
  dialog_initiate_failover_title: T("Initiate Failover"),
  dialog_initiate_failover_message: T("Initiating failover will temporarily disable services while failing over.  Failover now?"),
  dialog_initiate_failover_checkbox: T("Reboot current TrueNAS controller?"),

  dialog_sync_to_peer_title: T("Sync to Peer"),
  dialog_sync_to_peer_message: T("Are you sure you want to sync to peer?"),
  dialog_sync_to_peer_checkbox: T("Reboot Standby TrueNAS controller"),
  dialog_button_ok: T('Proceed'),

  dialog_sync_from_peer_title: T("Sync from Peer"),
  dialog_sync_from_peer_message: T("Are you sure you want to sync from peer?"),

  snackbar_sync_from_peer_message_success: T("Sync from Peer: Success!"),
  snackbar_sync_from_peer_success_action: T("Ok"),

  snackbar_sync_to_peer_message_success: T("Sync to Peer: Success!"),
  snackbar_sync_to_peer_success_action: T("Ok"),

  disabled_placeholder: T('Disabled'),
  disabled_tooltip: T(''),

  master_placeholder: T('Master'),
  master_tooltip: T(''),

  timeout_placeholder: T('Timeout'),
  timeout_tooltip: T(''),


};