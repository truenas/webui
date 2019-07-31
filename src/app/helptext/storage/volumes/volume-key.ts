import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

const passphrase_msg = T(' a passphrase creates a new encryption key \
 file and invalidates any existing recovery key or encryption key files. \
 A dialog opens to save a backup of the new encryption key. A new \
 recovery key can be added from the Encryption Operations menu.')

export default {
// Add key form
add_key_name_validation: [Validators.required],

add_key_instructions: T('This is an additional key file that can be used \
 to unlock the pool instead of the passphrase or encryption key file. <br /> <br /> \
 Entering the administrator password and clicking <b>ADD RECOVERY KEY</b> \
 generates a single recovery key file and downloads it to the local\
 system. Store the recovery key file in a secure location!<br /> \
 Adding a new recovery key invalidates any previously downloaded \
 recovery key file for this pool.'),
add_key_password_placeholder: T('Administrator Password'),

add_key_password_tooltip: T('Enter the root password to authorize this operation.'),
add_key_password_validation: [Validators.required],

// Change key form
changekey_adminpw_placeholder: T('Administrator Password'),
changekey_adminpw_tooltip: T('Enter the root password.'),
changekey_adminpw_validation: [Validators.required],

changekey_instructions: T('Creating') + passphrase_msg,
changekey_passphrase_placeholder: T('Passphrase'),
changekey_passphrase_tooltip: T('Enter the new encryption key passphrase.'),
changekey_passphrase_validation: [Validators.required],

changekey_instructions2: T('Changing') + passphrase_msg,
changekey_passphrase2_placeholder: T('Verify passphrase'),
changekey_passphrase2_tooltip: T('Confirm the encryption key passphrase.'),
changekey_passphrase2_validation: [Validators.required],

changekey_remove_passphrase_placeholder: T('Remove passphrase'),
changekey_remove_passphrase_tooltip: T('Invalidate the existing \
 passphrase by generating a new encryption key. Also invalidates any \
 existing encryption or recovery key files. A dialog opens to save a \
 copy of the new encryption key.'),

// Create key form
createkey_passphrase_placeholder: T('Passphrase'),
createkey_passphrase_tooltip: T('Enter the new encryption key passphrase.'),
createkey_passphrase_validation: [Validators.required],

createkey_passphrase2_placeholder: T('Verify passphrase'),
createkey_passphrase2_tooltip: T('Confirm the encryption key passphrase.'),
createkey_passphrase2_validation: [Validators.required],

// Rekey form
rekey_instructions: T('Re-keying the pool resets the encryption on the \
 GELI master key of each encrypted disk in this pool. <b>This invalidates \
 all existing encryption and recovery key files, as well as any configured \
 passphrase.</b><br /> \
 A new encryption key file is generated and an option opens to save a \
 backup of this file. Adding a passphrase or recovery key file is done \
 from the Encryption Operations menu.'),
rekey_password_label: T('Passphrase'),
rekey_password_placeholder: T('Administrator Password'),
rekey_password_tooltip: T('Enter the root password to authorize this operation.'),
rekey_password_validation: [Validators.required]
}
