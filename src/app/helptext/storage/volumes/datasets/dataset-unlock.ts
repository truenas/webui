import {Validators} from '@angular/forms';
import { T } from '../../../../translate-marker';

export default {
    dataset_unlock_title: T('Unlock Datasets'),
    unlock_key_file_placeholder: T('Unlock with Key file'),
    unlock_key_file_tooltip: T('Use an exported encryption key file to unlock datasets.'),
    unlock_children_placeholder: T('Unlock Children'),
    unlock_children_tooltip: T('Also unlock any encrypted dataset stored within this dataset.'),
    restart_services_placeholder: T('Restart attached VMs, Jails and Services'),
    restart_services_tooltip: T('Restarting system services after unlocking the dataset makes \
     the information contained within the dataset available to the rest of the system.'),
    upload_key_file_placeholder: T('Upload Key file'),
    upload_key_file_tooltip: T('Browse to the exported key file that can be used to unlock this \
     dataset.'),
    dataset_key_placeholder: T('Dataset Key'),
    dataset_key_tooltip: T('Encryption key that can unlock the dataset.'),
    dataset_key_validation: [Validators.minLength(64), Validators.maxLength(64)],
    dataset_name_paratext: T('<strong>Dataset:</strong> '),
    dataset_passphrase_placeholder: T('Dataset Passphrase'),
    dataset_passphrase_tooltip: T('The user-defined string that can unlock this dataset.'),
    dataset_passphrase_validation: [Validators.minLength(8)],
    fetching_encryption_summary_title: T('Fetching Encryption Summary'),
    fetching_encryption_summary_message: T('Fetching Encryption Summary for '),
    unlocking_datasets_title: T('Unlocking Datasets'),
    unlocking_datasets_message: T('Unlocking datasets for '),
    unlock_dataset_dialog: {
        title: T('Unlock Datasets'),
        errors: T('Errors'),
        errors_message: T('The following datasets cannot be unlocked.'),
        error_dialog_title: T('Error details for '),
        unlock: T('Unlock'),
        unlock_message: T('These datasets will be unlocked with the provided credentials.'),
        ok_button: T('Continue'),
        cancel_button: T('Cancel')
    },
    unlock_result_dialog: {
        errors_message: T('These datasets could not be unlocked.'),
        unlock_message: T('These datasets were successfully unlocked.'),
        skipped_message: T('These datasets were not unlocked because the parent datasets could not be unlocked.'),
    },
    unlock_successful_title: T('Unlock Successful'),
    unlock_successful_message: T('Datasets for '),
    unlock_successful_message2: T(' successfully unlocked'),
}
