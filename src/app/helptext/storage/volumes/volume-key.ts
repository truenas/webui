import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
// Add key form
add_key_name_validation: [Validators.required],
add_key_instructions: T('Adding a recovery key invalidates any previous recovery key. The new recovery \
 key will download automatically. Back up this key. No copy of the key is stored by the system. This \
 key can be used instead of the password to unlock this pool.'),
add_key_password_placeholder: T('Root password'),
add_key_password_tooltip: T('Enter the root password to authorize this operation.'),
add_key_password_validation: [Validators.required],

// Change key form
changekey_adminpw_placeholder: T('Root Password'),
changekey_adminpw_tooltip: T('Enter the root password.'),
changekey_adminpw_validation: [Validators.required],

changekey_instructions: T('Creating a passphrase requires the creation of a new \
 encryption key and invalidates any existing recovery key. A dialog will open to save \
 a backup of the new encryption key. A new recovery key, if desired, can be added \
 from the encryption menu.'),
changekey_passphrase_placeholder: T('Passphrase'),
changekey_passphrase_tooltip: T('Enter the new passphrase for the encryption key.'),
changekey_passphrase_validation: [Validators.required],

changekey_instructions2: T('Changing a passphrase requires the creation of a new \
 encryption key and invalidates any existing recovery key. A dialog will open to save \
 a backup of the new encryption key. A new recovery key, if desired, can be added \
 from the encryption menu.'),
changekey_passphrase2_placeholder: T('Verify passphrase'),
changekey_passphrase2_tooltip: T('Confirm the encryption key passphrase.'),
changekey_passphrase2_validation: [Validators.required],

changekey_remove_passphrase_placeholder: T('Remove passphrase'),
changekey_remove_passphrase_tooltip: T('Select to remove the passphrase from this pool.'),

// Create key form
createkey_passphrase_placeholder: T('Passphrase'),
createkey_passphrase_tooltip: T('Enter the new passphrase for the encryption key.'),
createkey_passphrase_validation: [Validators.required],

createkey_passphrase2_placeholder: T('Verify passphrase'),
createkey_passphrase2_tooltip: T('Confirm the encryption key passphrase.'),
createkey_passphrase2_validation: [Validators.required],

// Rekey form
rekey_instructions: T('Rekeying generates a new encryption key, replacing the old one on the disks in the pool.\
 Passphrases will be removed by this operation, and any existing recovery key will be invalidated. \
 A dialog will open to save a backup of the new encryption key. A new recovery key, if desired, \
 can be added from the encryption menu.'),
rekey_password_label: T('Passphrase'),
rekey_password_placeholder: T('Root password'),
rekey_password_tooltip: T('Enter the root password to authorize this operation.'),
rekey_password_validation: [Validators.required]
}