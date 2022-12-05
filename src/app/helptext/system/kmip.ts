import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextSystemKmip = {
  server: {
    tooltip: T('Host name or IP address of the central key server.'),
  },

  port: {
    tooltip: T('Connection port number on the central key server.'),
  },

  certificate: {
    tooltip: T('Certificate to use for key server authentication. A valid certificate is\
 required to verify the key server connection. WARNING: for security reasons, please protect\
 the Certificate used for key server authentication.'),
  },

  certificate_authority: {
    tooltip: T('Certificate Authority (CA) to use for connecting to the key server. A valid\
 CA public certificate is required to authenticate the connection. WARNING: for security reasons,\
 please protect the Certificate Authority used for key server authentication.'),
  },

  manage_sed_disks: {
    tooltip: T('Self-Encrypting Drive (SED) passwords can be managed with KMIP. Enabling this\
 option allows the key server to manage creating or updating the global SED password, creating or\
 updating individual SED passwords, and retrieving SED passwords when SEDs are unlocked. Disabling\
 this option leaves SED password management with the local system.'),
  },

  manage_zfs_keys: {
    tooltip: T('Use the KMIP server to manage ZFS encrypted dataset keys. The key server stores,\
 applies, and destroys encryption keys whenever an encrypted dataset is created, when an existing key\
 is modified, an encrypted dataset is unlocked, or an encrypted dataset is removed. Unsetting this option\
 leaves all encryption key management with the local system.'),
  },

  enabled: {
    tooltip: T('Activate KMIP configuration and begin syncing keys with the KMIP server.'),
  },

  change_server: {
    tooltip: T('Move existing keys from the current key server to a new key server. \
 To switch to a different key server, key synchronization must be <i>Enabled</i>, then \
 enable this setting, update the key server connection configuration, and click <b>SAVE</b>.'),
  },

  validate: {
    tooltip: T('Tests the server connection and verifies the chosen <b>Certificate</b> \
 chain. To test, configure the <i>Server</i> and <i>Port</i> values, select a \
 <i>Certificate</i> and <i>Certificate Authority</i>, enable this setting, and \
 click <b>SAVE</b>.'),
  },

  force_clear: {
    tooltip: T('Cancel any pending Key synchronization.'),
  },

  jobDialog: {
    title: T('Saving KMIP Config'),
  },

  syncInfoDialog: {
    title: T('Keys Synced'),
    info: T('ZFS/SED keys synced between KMIP Server and TN database.'),
  },

  clearSyncKeyInfoDialog: {
    title: T('Pending Sync Keys Cleared'),
    info: T('Keys pending to be synced between KMIP server and TN database were cleared.'),
  },
};
