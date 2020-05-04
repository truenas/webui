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
        DISAGREE_CARP: T(`Nodes CARP states do not agree.`),
        MISMATCH_DISKS : T(`The ${globalHelptext.ctrlrs} do not have the same quantity of disks.`),
        NO_CRITICAL_INTERFACES: T('No network interfaces are marked critical for failover.'),
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
    },

    signupDialog: {
        title: T('Connect to TrueCommand Cloud'),
        content: T('This allows your TrueNAS system to be monitored and administrated by\
 TrueCommand. Click <b>SIGNUP</b> to create a new TrueCommand Cloud instance or <b>CONNECT</b> to join an existing instance.'),
        singup_btn: T('SIGNUP'),
        connect_btn: T('CONNECT'),
    },

    updateDialog: {
        title_connect: T('Connect to TrueCommand Cloud'),
        title_update: T('Update TrueCommand Settings'),
        connect_btn: T('CONNECT'),
        save_btn: T('SAVE'),
        api_placeholder: T('API Key'),
        api_tooltip: T('Enter or paste the API key provided from \
<a href="https://portal.ixsystems.com/portal/login/" target="_blank">iXsystems Account Services</a>. \
Login or signup is required.'),
        enabled_placeholder: T('Enable'),
        enabled_tooltip: T('Immediately connect to TrueCommand.'),
    },

    tcDialog: {
        title: T('Open TrueCommand User Interface'),
        message: T(`<em>Warning:</em> The WireGuard service must be active on the client system to access the TrueCommand UI.`),
        confirmBtnMsg: T('Continue'),
    },

    tcDeregisterBtn: T('Deregister'),
    tcDeregisterDialog: {
        title: T('Deregister TrueCommand Cloud Service'),
        icon: 'warning',
        message: T('Are you sure you want to deregister TrueCommand Cloud Service?'),
        confirmBtnMsg: T('Confirm'),
    },

    deregisterInfoDialog: {
        title: T('TrueCommand Cloud Service deregistered'),
        message: T('TrueCommand Cloud Service has been deregistered.')
    }
}

