import { T } from '../translate-marker';

export default {
    ha_status : T('HA Status'),
    ha_status_text_enabled : T('HA Enabled'),
    ha_is_enabled : T('HA is enabled'),
    ha_status_text_disabled : T('HA Disabled'),
    ha_disabled_reasons : {
        NO_VOLUME : T('No pools are configured.'),
        NO_VIP : T('No interfaces configured with Virtual IP.'),
        NO_SYSTEM_READY : T('Other storage controller has not finished booting.'),
        NO_PONG : T('Other storage controller cannot be reached.'),
        NO_FAILOVER : T('Failover is administratively disabled.'),
        NO_LICENSE: T('Other storage controller has no license'),
        MISMATCH_DISKS : T('The storage controllers do not have the same quantity of disks.')
    }
}
