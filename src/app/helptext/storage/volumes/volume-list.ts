import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
unlockDialog_password_placeholder: T('Passphrase'),

unlockDialog_recovery_key_placeholder: T('Recovery Key'),
unlockDialog_recovery_key_tooltip: T('Unlock the pool with a recovery \
 key file instead of a passphrase. Select a recovery key file to upload \
 from the local system.'),

unlockDialog_services_placeholder: T('Restart Services'),
unlockDialog_services_tooltip: T('List of system services to restart when the pool is unlocked.'),

snapshotDialog_dataset_placeholder: T('Pool/Dataset'),

snapshotDialog_name_placeholder: T('Name'),
snapshotDialog_name_tooltip: T('Add a name for the new snapshot.'),
snapshotDialog_name_validation: [Validators.required],

snapshotDialog_recursive_placeholder: T('Recursive'),
snapshotDialog_recursive_tooltip: T('Set to include child datasets of the chosen dataset.'),

vmware_sync_placeholder: T('VMWare Sync'),
vmware_sync_tooltip: T(''),

exportAction: T("Export/Disconnect"),

exportMessages: {
    servicesA: T('These services depend on pool '),
    servicesB: T(' and will be disrupted if the pool is detached:'),
    running: T('These running processes are using '),
    unknown: T('These unknown processes are using this pool: '),
    terminated: T('WARNING: These unknown processes will be terminated while exporting the pool. '),

    onfail: {
        stopServices: T('These services must be stopped to export the pool:'),
        restartServices: T('These services must be restarted to export the pool:'),
        continueMessage: T('Exporting/disconnecting will continue after services have been managed.'),
        continueAction: T('Manage Services and Continue'),
        unableToTerminate: T('Unable to terminate processes which are using this pool: ')
    }
},

exportError: T("Error exporting/disconnecting pool."),

exportDialog:  {
    title: T("Export/disconnect pool: '"),
    warningA: T("WARNING: Exporting/disconnecting pool <i>"),
    warningB: T("</i>.\
 Data on the pool will not be available after export.\
 Data on the pool disks can be destroyed by setting the <b>Destroy data</b> option.\
 Back up critical data <b>before</b> exporting/disconnecting the pool."),
    unknownStateA: T('The pool <i>'),
    unknownStateB: T('</i>is in the database but not connected to the machine. If it was exported by \
    mistake, reconnect the hardware and use <b>Import Pool</b>.<br /><br />'),
    encryptWarning: T("' is encrypted! If the passphrase for\
 this encrypted pool has been lost, the data will be PERMANENTLY UNRECOVERABLE!\
 Before exporting/disconnecting encrypted pools, download and safely\
 store the encryption key and any passphrase for it."),
    destroy: T("Destroy data on this pool?"),
    cascade: T("Delete configuration of shares that used this pool?"),
    confirm: T("Confirm Export/Disconnect"),
    unknown_status_alt_text: T('(Remove pool from database)'),
    saveButton: T('Export/Disconnect')
},

downloadKey: T('Download Key'),
exporting: T("Exporting Pool"),
exportDisconnect: T("Export/Disconnect Pool"),
exportSuccess: T("Successfully exported/disconnected '"),
destroyed: T("'. All data on that pool was destroyed."),

upgradePoolDialog_warning: T("Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of FreeNAS: "),

upgradePoolDialog_warning_truenas: T("Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of TrueNAS: "),

pool_lock_warning_paratext_a: T("WARNING: Locking pool <i>"),
pool_lock_warning_paratext_b: T("</i>.\
 Data on the pool will not be accessible until the pool is unlocked."),

permissions_edit_msg: T('Root dataset permissions cannot be edited.'),
acl_edit_msg: T('Root dataset ACL cannot be edited.'),

unlock_msg: T('Unlock the pool with either a passphrase or a recovery key.'),

geli_error: {
    title: T('Error'),
    message: T('This geli-encrypted pool failed to decrypt.'),
    button: T('Close')
}
}
