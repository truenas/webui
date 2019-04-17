import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_failover = {
  dialog_sync_to_peer_title: T("Sync to Peer"),
  dialog_sync_to_peer_message: T("Are you sure you want to sync to peer?"),
  dialog_sync_to_peer_checkbox: T("Reboot Standby Storage Controller"),
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
