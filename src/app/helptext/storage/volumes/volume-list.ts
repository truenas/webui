import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
unlockDialog_password_placeholder: T('Passphrase'),

unlockDialog_recovery_key_placeholder: T('Recovery Key'),
unlockDialog_recovery_key_tooltip: T('Click <b>Browse</b> to select a recovery key to\
 upload. This allows the system to decrypt the disks.'),

unlockDialog_services_placeholder: T('Restart Services'),
unlockDialog_services_tooltip: T('List of system services to restart when the pool is unlocked.'),

snapshotDialog_dataset_placeholder: T('Pool/Dataset'),

snapshotDialog_name_placeholder: T('Name'),
snapshotDialog_name_tooltip: T('Add a name for the new snapshot.'),
snapshotDialog_name_validation: [Validators.required],

snapshotDialog_recursive_placeholder: T('Recursive'),
snapshotDialog_recursive_tooltip: T('Set to include child datasets of the chosen dataset.'),

vmware_sync_placeholder: T('VMWare Sync'),
vmware_sync_tooltip: T('Need tooltip'),

detachDialog_pool_detach_warning_paratext_a: T("WARNING: Exporting/disconnecting '"),
detachDialog_pool_detach_warning_paratext_b: T("'.\
 Exporting/disconnecting a pool makes the data unavailable.\
 The pool data can also be wiped by setting the\
 related option. Back up any critical data\
 before exporting/disconnecting a pool."),

detachDialog_pool_detach_warning__encrypted_paratext: T("' is encrypted! If the passphrase for\
 this encrypted pool has been lost, the data will be PERMANENTLY UNRECOVERABLE!\
 Before exporting/disconnecting encrypted pools, download and safely\
 store the recovery key."),

detachDialog_pool_detach_destroy_checkbox_placeholder: T("Destroy data on this pool?"),
detachDialog_pool_detach_cascade_checkbox_placeholder: T("Delete configuration of shares that used this pool?"),
detachDialog_pool_detach_confim_checkbox_placeholder: T("Confirm export/disconnect"),

upgradePoolDialog_warning: T("Proceed with upgrading the pool? WARNING: Upgrading a pool is a\
 one-way operation that might make some features of\
 the pool incompatible with older versions of FreeNAS: ")

}