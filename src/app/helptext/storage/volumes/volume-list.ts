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
 the pool incompatible with older versions of TrueNAS: "),

pool_lock_warning_paratext_a: T("WARNING: Locking pool <i>"),
pool_lock_warning_paratext_b: T("</i>.\
 Data on the pool will not be accessible until the pool is unlocked."),

permissions_edit_msg1: T('Root dataset permissions cannot be edited.'),
permissions_edit_msg2: T('This dataset has an active ACL. Changes to permissions must be made with the ACL editor.'),
acl_edit_msg: T('Root dataset ACL cannot be edited.'),

expand_pool_dialog: {
    title: T("Expand pool "),
    message: T('Expand pool to fit all available disk space.'),
    passphrase_placeholder: T('Passphrase'),
    save_button: T("Expand Pool"),
},
expand_pool_success_dialog: {
    title: T("Pool Expanded"),
    message: T("Successfully expanded pool ")
},

unlock_msg: T('Unlock the pool with either a passphrase or a recovery key.'),

pool_actions_title: T('Pool Actions'),
encryption_actions_title: T('Encryption Actions'),

export_keys_title: T('Export Dataset Keys for '),
export_keys_message: T('Export dataset keys which can be used to unlock datasets for '),
export_keys_button: T('Export'),

dataset_actions: T('Dataset Actions'),
zvol_actions: T('Zvol Actions'),
unlock_action: T('Unlock'),
lock_action: T('Lock'),
encryption_options: T('Encryption Options'),
encryption_options_dialog: {
    dialog_title: T('Edit Encryption Options for '),
    inherit_placeholder: T('Inherit encryption properties from parent'),
    inherit_tooltip:T(''),
    dialog_saved_title: T('Encryption Options Saved'),
    dialog_saved_message1: T('Encryption options for '),
    dialog_saved_message2: T(' successfully saved.'),
    save_encryption_options: T('Save Encryption Options'),
    saving_encryption_options: T('Saving Encryption Options...'),
    confirm_checkbox: T('Confirm'),
    save_button: T('Save')
},
lock_dataset_dialog: {
    dialog_title: T('Lock Dataset '),
    dialog_message: T('Lock dataset '),
    checkbox_message: T('Force unmount '),
    button: T('Lock'),
    locking_dataset: T('Locking Dataset'),
    locking_dataset_description: T('Locking dataset ')
},
encryptMsgA: T('These services depend on pool '),
encryptMsgB: T(' and will be disrupted if the pool is locked:'),
runningMsg: T('These running services are using'),
unknownMsg: T('These unknown processes are using this pool:'),
terminatedMsg: T('WARNING: These unknown processes will be terminated while locking the pool.'),
dataErrMsg: T('Error gathering data on pool.')
}
