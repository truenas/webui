import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextUnlock = {
  keyFileLabel: T('Unlock with Key file'),
  keyFileTooltip: T('Use an exported encryption key file to unlock datasets.'),
  unlockChildrenLabel: T('Unlock Child Encrypted Roots'),
  unlockChildrenTooltip: T('Also unlock any separate encryption roots that are children of this dataset. \
Child datasets that inherit encryption from this encryption root will be unlocked in either case.'),
  uploadKeyFileLabel: T('Upload Key file'),
  uploadKeyFileTooltip: T('Browse to the exported key file that can be used to unlock this \
     dataset.'),
  datasetKeyLabel: T('Dataset Key'),
  datasetPassphraseLabel: T('Dataset Passphrase'),
  datasetPassphraseTooltip: T('The user-defined string that can unlock this dataset.'),
  datasetForceTooltip: T('In some cases it\'s possible that the provided key/passphrase is valid but the path \
where the dataset is supposed to be mounted after being unlocked already exists and is not empty. In this case, unlock \
operation would fail. This can be overridden by Force flag. \
When it is set, system will rename the existing \
directory/file path where the dataset should be mounted resulting in successful unlock of the dataset.'),
  fetchingEncryptionSummaryTitle: T('Fetching Encryption Summary'),
  fetchingEncryptionSummaryMessage: T('Fetching Encryption Summary for {dataset}'),
  unlockingDatasetsTitle: T('Unlocking Datasets'),
  unlockDatasetDialog: {
    title: T('Unlock Datasets'),
    errors: T('Errors'),
    errorsMessage: T('The following datasets cannot be unlocked.'),
    errorDialogTitle: T('Error details for '),
    unlock: T('Unlock'),
    unlockMessage: T('These datasets will be unlocked with the provided credentials.'),
    continueButton: T('Continue'),
    cancelButton: T('Close'),
  },
  unlockResultDialog: {
    errorsMessage: T('These datasets could not be unlocked.'),
    unlockMessage: T('These datasets were successfully unlocked.'),
    skippedMessage: T('These datasets were not unlocked because the parent datasets could not be unlocked.'),
  },
};
