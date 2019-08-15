import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

const passphrase_msg = T(' a passphrase creates a new encryption key \
 file and invalidates any existing recovery key or encryption key files. \
 A dialog opens to save a backup of the new encryption key. Select <b>DOWNLOAD \
 ENCRYPTION KEY</b> to get the key file without setting a passphrase. A new \
 <b>recovery key</b> can be added from the Encryption Operations menu.')

export default {
// Add key form
add_key_headline: T('Recovery Key for Pool '),
add_key_name_validation: [Validators.required],

add_key_instructions: T('The recovery key is an additional key file that can be used \
 to unlock the pool instead of the passphrase or encryption key file. <br /> <br /> \
 Entering the administrator password and clicking <b>ADD RECOVERY KEY</b> \
 generates a single recovery key file and downloads it to the local\
 system. Store the recovery key file in a secure location!<br /> \
 Adding a new recovery key invalidates any previously downloaded \
 recovery key file for this pool. <br /> <br />Clicking <b>INVALIDATE EXISTING KEY</b> \
 also invalidates any previously downloaded key for this pool without creating a new key.'),
add_key_password_placeholder: T('Administrator Password'),
add_key_invalid_button: T('Invalidate Existing Key'),
add_key_custom_cancel: T('Cancel'),

add_key_password_tooltip: T('Enter the administrator password to authorize this operation.'),
add_key_password_validation: [Validators.required],

// Change key form
changekey_adminpw_placeholder: T('Administrator Password'),
changekey_adminpw_tooltip: T('Enter the administrator password to authorize this operation.'),
changekey_adminpw_validation: [Validators.required],

changekey_headline: T('Encryption Key for Pool '),
changekey_instructions: T('Creating') + passphrase_msg,
changekey_passphrase_placeholder: T('Passphrase'),
changekey_passphrase_tooltip: T('Enter the new encryption key passphrase.'),
changekey_passphrase_validation: [Validators.required],

changekey2_headline: T('Encryption Key for Pool '),
changekey_instructions2: T('Changing') + passphrase_msg,
changekey_passphrase2_placeholder: T('Verify passphrase'),

changekey_remove_passphrase_placeholder: T('Remove passphrase'),
changekey_remove_passphrase_tooltip: T('Invalidate the existing \
 passphrase by generating a new encryption key. Also invalidates any \
 existing encryption or recovery key files. A dialog opens to save a \
 copy of the new encryption key.'),

// Create key form
createkey_passphrase_placeholder: T('Passphrase'),
createkey_passphrase_tooltip: T('Enter the new encryption key passphrase.'),
createkey_passphrase_validation: [Validators.required],

// Rekey form
rekey_headline: T('Reset Keys for Pool '),
rekey_instructions: T('Reset the master key encryption used by this pool. Invalidates \
 any current encryption key file, recovery key file, and passphrase for the pool. \
 Clicking <b>RESET ENCRYPTION</b> also generates a new encryption key file and opens a dialog \
 to download a backup of the new key. Set <i>Add Recovery Key</i> to also generate new \
 recovery key file for the pool (in addition to a password) and open a dialog to download it.'),
rekey_password_label: T('Passphrase'),
rekey_password_placeholder: T('Administrator password'),
rekey_password_tooltip: T('Enter the administrator password to authorize this operation.'),
rekey_password_validation: [Validators.required],

encryptionkey_passphrase_instructions: T('Optional: Generate the new encryption key with a \
 passphrase already added '),
encryptionkey_passphrase_placeholder: T('Encryption Key Passphrase'),
encryptionkey_passphrase_tooltip: T('Add a passphrase to the new encryption key. This can \
 be used to lock and unlock the pool.'),

set_recoverykey_checkbox_placeholder: 'Add Optional Recovery Key',
set_recoverykey_checkbox_tooltip: 'Generate a new recovery key file for the pool.',

set_recoverykey_dialog_title: T('WARNING!'),
set_recoverykey_dialog_message: T('The recovery key can be used instead of the passphrase to unlock the pool. \
 Download the key and store it in a secure location! This key invalidates any previously downloaded \
 recovery keys for this pool.'),
set_recoverykey_dialog_button: T('Download Recovery Key'),

delete_recovery_key_title: T('Delete Current Recovery Key'),
delete_recovery_key_message: T('This action invalidates any previously downloaded recovery key.')

}
