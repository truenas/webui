import { T } from '../../../translate-marker';

export default {
    cifs_srv_netbiosname_placeholder : T('NetBIOS Name:'),
    cifs_srv_netbiosalias_placeholder : T('NetBIOS Alias:'),
    cifs_srv_workgroup_placeholder : T('Workgroup'),
    cifs_srv_description_placeholder : T('Description'),
    cifs_srv_doscharset_placeholder : T('DOS Charset'),
    cifs_srv_doscharset_options: [
            {label : 'CP437', value : 'CP437'},
            {label : 'CP850', value : 'CP850'},
            {label : 'CP852', value : 'CP852'},
            {label : 'CP866', value : 'CP866'},
            {label : 'CP932', value : 'CP932'},
            {label : 'CP949', value : 'CP949'},
            {label : 'CP950', value : 'CP950'},
            {label : 'CP1026', value : 'CP1026'},
            {label : 'CP1251', value : 'CP1251'},
            {label : 'ASCII', value : 'ASCII'},
          ],

    cifs_srv_unixcharset_placeholder : T('UNIX Charset'),
    cifs_srv_unixcharset_options: [
            {label : 'UTF-8', value : 'CP437'},
            {label : 'iso-8859-1', value : 'iso-8859-1'},
            {label : 'iso-8859-15', value : 'iso-8859-15'},
            {label : 'gb2312', value : 'gb2312'},
            {label : 'EUC-JP', value : 'EUC-JP'},
            {label : 'ISCII', value : 'ISCII'},
          ],
    
    cifs_srv_loglevel_placeholder : T('Log Level'),
    cifs_srv_loglevel_options : [
            {label : 'None', value : 0},
            {label : 'Minimum', value : 1},
            {label : 'Normal', value : 2},
            {label : 'Full', value : 3},
            {label : 'Debug', value : 10},
          ],

    cifs_srv_syslog_placeholder : T('Use syslog only'),
    cifs_srv_localmaster_placeholder : T('Local Master'),
    cifs_srv_domain_logons_placeholder : T('Domain Logons'),
    cifs_srv_timeserver_placeholder : T('Time Server For Domain'),
    cifs_srv_guest_placeholder : T('Guest Account'),
    cifs_srv_filemask_placeholder : T('File Mask'),
    cifs_srv_dirmask_placeholder : T('Directory Mask'),
    cifs_srv_nullpw_placeholder : T('Allow Empty Password'),
    cifs_srv_smb_options_placeholder : T('Auxiliary Parameters'),
    cifs_srv_unixext_placeholder : T('Unix Extensions'),
    cifs_srv_zeroconf_placeholder : T('Zeroconf share discovery'),
    cifs_srv_hostlookup_placeholder : T('Hostnames Lookups'),
    cifs_srv_min_protocol_placeholder : T('Server Minimum Protocol'),
    cifs_srv_max_protocol_placeholder : T('Server Maximum Protocol'),
    cifs_srv_allow_execute_always_placeholder : T('Allow Execute Always'),
    cifs_srv_obey_pam_restrictions_placeholder : T('Obey Pam Restrictions'),
    cifs_srv_ntlmv1_auth_placeholder : T('NTLMv1 Auth'),
    bindips_placeholder : T('Bind IP Addresses')
}