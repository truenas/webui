import { Validators } from "@angular/forms";
import { T } from "app/translate-marker";

export const helptext_system_kmip = {
    fieldset_server: T('KMIP Server'),
    fieldset_certificate: T('Certificate'),
    fieldset_management: T('Management'),

    server: {
        placeholder: T('Server'),
        tooltip: T('Host name or IP address of the central key server.'),
    },

    port: {
        placeholder: T('Port'),
        tooltip: T('Connection port number on the central key server.'),
    },

    certificate: {
        placeholder: T('Certificate'),
        tooltip: T('Certificate to use for key server authentication. A valid certificate is\
 required to verify the key server connection. WARNING: for security reasons, please protect\
 the Certificate used for key server authentication.'),
    },

    certificate_authority: {
        placeholder: T('Certificate Authority'),
        tooltip: T('Certificate Authority (CA) to use for connecting to the key server. A valid\
 CA public certificate is required to authenticate the connection. WARNING: for security reasons,\
 please protect the Certificate Authority used for key server authentication.'),
    },

    manage_sed_disks: {
        placeholder: T('Manage SED Password'),
        tooltip: T('Self-Encrypting Drive (SED) passwords can be managed with KMIP. Enabling this\
 option allows the key server to manage creating or updating the global SED password, creating or\
 updating individual SED passwords, and retrieving SED passwords when SEDs are unlocked. Disabling\
 this option leaves SED password management with the local system.'),
    },

    manage_zfs_keys: {
        placeholder: T('Manage ZFS Keys'),
        tooltip: T('Use the KMIP server to manage ZFS encrypted dataset keys. The key server stores,\
 applies, and destroys encryption keys whenever an encrypted dataset is created, when an existing key\
 is modified, an encrypted dataset is unlocked, or an encrypted dataset is removed. Unsetting this option\
 leaves all encryption key management with the local system.'),
    },

    jobDialog: {
        title: T('Saving KMIP Config'),
    },

    syncInfoDialog: {
        title: T('Sync Keys'),
        info: T('Synced ZFS/SED keys between KMIP Server and TN database.'),
    },

    clearSyncKeyInfoDialog: {
        title: T('Clear Sync Keys'),
        info: T('Cleared all keys which are pending to be synced between KMIP server and TN database.'),
    }
}