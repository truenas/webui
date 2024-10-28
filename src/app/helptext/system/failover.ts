import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemFailover = {
  dialog_initiate_failover_title: T('Initiate Failover'),
  dialog_initiate_failover_message: T('WARNING: A failover will \
 temporarily interrupt system services.'),
  dialog_initiate_action: T('Failover'),

  dialog_sync_to_peer_title: T('Sync to Peer'),
  dialog_sync_to_peer_message: T('Are you sure you want to sync to peer?'),

  dialog_sync_to_peer_checkbox: T('Restart standby TrueNAS controller'),
  dialog_button_ok: T('Proceed'),

  dialog_sync_from_peer_title: T('Sync from Peer'),
  dialog_sync_from_peer_message: T('Are you sure you want to sync from peer?'),

  confirm_dialogs: {
    sync_title: T('Success'),
    sync_from_message: T('Sync from peer succeeded.'),
    sync_to_message: T('Sync to peer succeeded.'),
  },

  disabled_tooltip: T('Disable automatic failover.'),

  master_tooltip: T('Make the currently active TrueNAS controller the default when both TrueNAS controllers are online and HA is enabled. To change the default TrueNAS controller, unset this option on the default TrueNAS controller and allow the system to fail over. This briefly interrupts system services.'),

  timeout_tooltip: T('Number of seconds to wait after a network failure \
 before triggering a failover. <i>0</i> means a failover occurs \
 immediately, or after two seconds when the system is using a link \
 aggregation.'),

  master_dialog_title: T('Confirm Failover'),
  master_dialog_warning: T('Forcing the other TrueNAS controller to \
 become active requires a failover. This will temporarily interrupt \
 system services. After confirmation, <b>SAVE AND FAILOVER</b> must \
 be clicked on the previous screen.'),
};
