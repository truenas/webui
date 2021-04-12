import { T } from '../../translate-marker';
import { Validators } from '@angular/forms';

export default {
    activeDirectory: {
        title: T('Active Directory'),
        domainName: T('Domain Name'),
        domainAccountName: T('Domain Account Name'),
    },
    idmap: {
        title: T('Idmap'),
    },
    ldap: {
        title: T('LDAP'),
        hostname: T('Hostname'),
        baseDN: T('Base DN'),
        bindDN: T('Bind DN'),
    },
    kerberosSettings: {
        title: T('Kerboros Settings'),
        appdefaults: T('Appdefaults Auxiliary Parameters'),
        libdefaults: T('Libdefaults Auxiliary Parameters'),
    },
    kerboerosRealms: {
        title: T('Kerboeros Realms'),
    },
    kerboerosKeytab: {
        title: T('Kerboeros Keytab'),
    },
    button: {
        settings: T('Settings'),
        add: T('Add'),
    }
}
