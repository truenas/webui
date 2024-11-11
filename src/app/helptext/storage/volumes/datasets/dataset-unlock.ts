import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextUnlock = {
  dataset_unlock_title: T('Unlock Datasets'),
  unlock_key_file_placeholder: T('Unlock with Key file'),
  unlock_key_file_tooltip: T('Use an exported encryption key file to unlock datasets.'),
  unlock_children_placeholder: T('Unlock Child Encrypted Roots'),
  unlock_children_tooltip: T('Also unlock any separate encryption roots that are children of this dataset. \
Child datasets that inherit encryption from this encryption root will be unlocked in either case.'),
  upload_key_file_placeholder: T('Upload Key file'),
  upload_key_file_tooltip: T('Browse to the exported key file that can be used to unlock this \
     dataset.'),
  dataset_key_placeholder: T('Dataset Key'),
  dataset_key_tooltip: T('Encryption key that can unlock the dataset.'),
  dataset_key_validation: [Validators.minLength(64), Validators.maxLength(64)],
  dataset_name_paratext: T('<strong>Dataset:</strong> '),
  dataset_passphrase_placeholder: T('Dataset Passphrase'),
  dataset_passphrase_tooltip: T('The user-defined string that can unlock this dataset.'),
  dataset_force_tooltip: T('In some cases it\'s possible that the provided key/passphrase is valid but the path \
where the dataset is supposed to be mounted after being unlocked already exists and is not empty. In this case, unlock \
operation would fail. This can be overridden by Force flag. \
When it is set, system will rename the existing \
directory/file path where the dataset should be mounted resulting in successful unlock of the dataset.'),
  dataset_passphrase_validation: [Validators.minLength(8)],
  fetching_encryption_summary_title: T('Fetching Encryption Summary'),
  fetching_encryption_summary_message: T('Fetching Encryption Summary for {dataset}'),
  unlocking_datasets_title: T('Unlocking Datasets'),
  unlock_dataset_dialog: {
    title: T('Unlock Datasets'),
    errors: T('Errors'),
    errors_message: T('The following datasets cannot be unlocked.'),
    error_dialog_title: T('Error details for '),
    unlock: T('Unlock'),
    unlock_message: T('These datasets will be unlocked with the provided credentials.'),
    ok_button: T('Continue'),
    cancel_button: T('Close'),
  },
  unlock_result_dialog: {
    errors_message: T('These datasets could not be unlocked.'),
    unlock_message: T('These datasets were successfully unlocked.'),
    skipped_message: T('These datasets were not unlocked because the parent datasets could not be unlocked.'),
  },
};
