import { T } from '../translate-marker';
import globalHelptext from '../helptext/global-helptext';

export default {
    ha_status : T('HA Status'),
    ha_status_text_enabled : T('HA Enabled'),
    ha_is_enabled : T('HA is enabled'),
    ha_status_text_disabled : T('HA Disabled'),
    ha_disabled_reasons : {
        NO_VOLUME : T('No pools are configured.'),
        NO_VIP : T('No interfaces configured with Virtual IP.'),
        NO_SYSTEM_READY : T(`Other ${globalHelptext.ctrlr} has not finished booting.`),
        NO_PONG : T(`Other ${globalHelptext.ctrlr} cannot be reached.`),
        NO_FAILOVER : T('Failover is administratively disabled.'),
        NO_LICENSE: T(`Other ${globalHelptext.ctrlr} has no license.`),
        MISMATCH_DISKS : T(`The ${globalHelptext.ctrlrs} do not have the same quantity of disks.`)
    },
    legacyUIWarning: `${globalHelptext.legacyUIWarning}`,
    updateRunning_dialog : {
        title: T('Update in Progress'),
        message: T(`A system update is in progress. It might have been \
 launched in another window or by an external source like TrueCommand. <b>${globalHelptext.sys_update_message}</b> `)
    },

    mat_tooltips : {
        toggle_hide: T('Toggle Hide/Open'),
        toggle_collapse: T('Toggle Collapse'),
        update: T('Update in Progress'),
        pending_network_changes: T('Pending Network Changes'),
        directory_services_monitor: T('Directory Services Monitor'),
        resilvering: T('Resilvering'),
        replication: T('Replication'),
        task_manager: T('Task Manager'),
        alerts: T('Alerts'),
        settings: T('Settings'),
        power: T('Power')        
    }
}

