import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

const passphrase_msg = T(' a passphrase invalidates an existing pool \
 recovery key file. To save a backup of the existing encryption key \
 without making any changes, click <b>DOWNLOAD ENCRYPTION KEY</b>.')

export default {
// Add key form
add_key_headline: T('Recovery Key for Pool '),
add_key_name_validation: [Validators.required],

add_key_instructions: T('The recovery key is an additional key file that \
 can be used to decrypt the pool. <br /> <br /> \
 Entering the administrator password and clicking <b>ADD RECOVERY KEY</b> \
 generates a single recovery key file and downloads it to the client \
 system. Store the recovery key file in a secure location! Adding a new \
 recovery key invalidates any previous recovery key files for this pool. \
 <br /> <br />To deactivate the recovery key for this pool, click \
 <b>INVALIDATE EXISTING KEY</b>.'),
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
changekey_remove_passphrase_tooltip: T('Delete the passphrase from \
 the encryption key. Invalidates an existing pool recovery key file. A \
 dialog prompts to back up the encryption key.'),

// Create key form
createkey_passphrase_placeholder: T('Passphrase'),
createkey_passphrase_tooltip: T('Enter the new encryption key passphrase.'),
createkey_passphrase_validation: [Validators.required],

// Rekey form
rekey_headline: T('Reset Keys for Pool '),
rekey_instructions: T('Reset the master key encryption used by this pool. \
 Invalidates the current encryption key, recovery key, and passphrase \
 for the pool. <br /> <br />\
 Clicking <b>RESET ENCRYPTION</b> generates a new encryption key and \
 prompts to download a backup of the new key.'),
rekey_password_label: T('Passphrase'),
rekey_password_placeholder: T('Administrator password'),
rekey_password_tooltip: T('Enter the administrator password to authorize this operation.'),
rekey_password_validation: [Validators.required],

encryptionkey_passphrase_instructions: T('Optional: Add passphrase and recovery key'),
encryptionkey_passphrase_placeholder: T('Encryption Key Passphrase'),
encryptionkey_passphrase_tooltip: T('Add a passphrase to the new \
 encryption key. This is used to lock and unlock the pool.'),

set_recoverykey_checkbox_placeholder: 'Download Recovery Key File',
set_recoverykey_checkbox_tooltip: 'Download a new pool recovery key file \
 to the client system. Requires creating a new passphrase.',

set_recoverykey_dialog_title: T('WARNING'),
set_recoverykey_dialog_message: T('The recovery key is used to decrypt \
 the pool. Store the key file in a secure location!'),
set_recoverykey_dialog_button: T('Download Recovery Key'),

delete_recovery_key_title: T('Remove Recovery Key'),
delete_recovery_key_message: T('Deactivate the recovery key for this pool?')

}
