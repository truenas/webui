import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemFailover = {
  failoverDialogTitle: T('Initiate Failover'),
  failoverDialogMessage: T('WARNING: A failover will \
 temporarily interrupt system services.'),
  failoverButton: T('Failover'),

  syncToPeerTitle: T('Sync to Peer'),
  syncToPeerMessage: T('Are you sure you want to sync to peer?'),

  syncToPeerRestartStandbyCheckbox: T('Restart standby TrueNAS controller'),
  proceedButton: T('Proceed'),

  syncFromPeerTitle: T('Sync from Peer'),
  syncFromPeerMessage: T('Are you sure you want to sync from peer?'),

  confirmDialogs: {
    syncFromMessage: T('Sync from peer succeeded.'),
    syncToMessage: T('Sync to peer succeeded.'),
  },

  masterTooltip: T('Make the currently active TrueNAS controller the default when both TrueNAS controllers are online and HA is enabled. To change the default TrueNAS controller, unset this option on the default TrueNAS controller and allow the system to fail over. This briefly interrupts system services.'),

  timeoutTooltip: T('Number of seconds to wait after a network failure \
 before triggering a failover. <i>0</i> means a failover occurs \
 immediately, or after two seconds when the system is using a link \
 aggregation.'),

  masterDialogTitle: T('Confirm Failover'),
  masterDialogWarning: T('Forcing the other TrueNAS controller to \
 become active requires a failover. This will temporarily interrupt \
 system services.'),
};
