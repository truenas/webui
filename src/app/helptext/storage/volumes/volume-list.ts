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

detachDialog_pool_detach_warning_paratext_a: T("WARNING: Exporting/disconnecting pool <i>"),
detachDialog_pool_detach_warning_paratext_b: T("</i>.\
 Data on the pool will not be available after export.\
 Data on the pool disks can be destroyed by setting the <b>Destroy data</b> option.\
 Back up critical data <b>before</b> exporting/disconnecting the pool."),

detachWarningForUnknownState: {
    message_a: T('The pool <i>'),
    message_b: T('</i>is in the database but not connected to the machine. If it was exported by \
 mistake, reconnect the hardware and use <b>Import Pool</b>.<br /><br />')
},

detachDialog_pool_detach_warning__encrypted_paratext: T("' is encrypted! If the passphrase for\
 this encrypted pool has been lost, the data will be PERMANENTLY UNRECOVERABLE!\
 Before exporting/disconnecting encrypted pools, download and safely\
 store the encryption key and any passphrase for it."),

detachDialog_pool_detach_destroy_checkbox_placeholder: T("Destroy data on this pool?"),
detachDialog_pool_detach_cascade_checkbox_placeholder: T("Delete configuration of shares that used this pool?"),
detachDialog_pool_detach_confim_checkbox_placeholder: T("Confirm Export/Disconnect"),
unknown_status_alt_text: T('(removes pool from database)'),

upgradePoolDialog_warning: T("Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of FreeNAS: ")

}
