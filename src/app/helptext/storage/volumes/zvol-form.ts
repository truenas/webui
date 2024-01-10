import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextZvol = {
  zvol_title_add: T('Add Zvol'),
  zvol_title_edit: T('Edit Zvol'),
  zvol_name_placeholder: T('Zvol name'),
  zvol_name_tooltip: T('Keep the zvol name short. Using a zvol name longer\
 than 63 characters can prevent accessing the zvol as a device.'),

  zvol_comments_placeholder: T('Comments'),
  zvol_comments_tooltip: T('Add any notes about this zvol.'),

  zvol_volsize_placeholder: T('Size for this zvol'),
  zvol_volsize_tooltip: T('Specify a size and value such as <i>10 GiB</i>.'),

  zvol_forcesize_placeholder: T('Force size'),
  zvol_forcesize_tooltip: T('The system restricts creating a zvol that brings the\
 pool to over 80% capacity. Set to force creation of\
 the zvol (<b>NOT Recommended</b>).'),

  zvol_sync_placeholder: T('Sync'),
  zvol_sync_tooltip: T('Sets the data write synchronization. <i>Inherit</i>\
 takes the sync settings from the parent dataset,\
 <i>Standard</i> uses the settings that have been\
 requested by the client software, <i>Always</i> waits\
 for data writes to complete, and <i>Disabled</i> never\
 waits for writes to complete.'),

  zvol_compression_placeholder: T('Compression level'),
  zvol_compression_tooltip: T('Encode information in less space than the \
 original data occupies. It is recommended to choose a compression algorithm \
 that balances disk performance with the amount of saved space.<br> <i>LZ4</i> is \
 generally recommended as it maximizes performance and dynamically identifies \
 the best files to compress.<br> <i>GZIP</i> options range from 1 for least \
 compression, best performance, through 9 for maximum compression with \
 greatest performance impact.<br> <i>ZLE</i> is a fast algorithm that only \
 eliminates runs of zeroes.'),
  zvol_compression_validation: [Validators.required],

  zvol_deduplication_placeholder: T('ZFS Deduplication'),
  zvol_deduplication_tooltip: T('Transparently reuse a single copy of duplicated \
 data to save space. Deduplication can improve storage capacity, but is RAM intensive. \
 Compressing data is generally recommended before using deduplication. Deduplicating data is \
 a one-way process. <b>Deduplicated data cannot be undeduplicated!</b>.'),
  zvol_deduplication_validation: [Validators.required],

  zvol_readonly_placeholder: T('Read-only'),
  zvol_readonly_tooltip: T('Set to prevent the zvol from being modified.'),

  zvol_sparse_placeholder: T('Sparse'),
  zvol_sparse_tooltip: T('Enable to use thin provisioning\
 where disk space for this volume is allocated <b>‘on demand’</b> as new writes are received.\
 Use caution when enabling this feature, as writes can fail when the pool is low on space.'),

  zvol_volblocksize_placeholder: T('Block size'),
  zvol_volblocksize_tooltip: T('The zvol default block size is automatically chosen\
 based on the number of the disks in the pool for a\
 general use case.'),

  zvol_volsize_zero_error: T('Volume size cannot be zero.'),
  zvol_volsize_shrink_error: T('Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.'),

  blocksize_warning: {
    a: T('Recommended block size based on pool topology:'),
    b: T('A smaller block size can reduce sequential I/O performance and space efficiency.'),
  },
  zvol_save_errDialog: {
    title: T('Error saving ZVOL.'),
    msg: T('Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.'),
  },

  dataset_form_encryption: {
    fieldset_title: T('Encryption Options'),
    inherit_checkbox_placeholder: T('Inherit'),
    inherit_checkbox_notencrypted: T('Inherit (non-encrypted)'),
    inherit_checkbox_encrypted: T('Inherit (encrypted)'),
    inherit_checkbox_tooltip: T('Use the encryption properties of the root dataset.'),
    encryption_checkbox_placeholder: T('Encryption'),
    encryption_checkbox_tooltip: T('Secure data within this dataset. Data is unusable until \
     unlocked with an encryption key or passphrase. If parent dataset has encryption enabled,\
     it is not possible to disable this option.'),
    encryption_type_placeholder: T('Encryption Type'),
    encryption_type_tooltip: T('How the dataset is secured. Choose between securing with\
 an encryption <i>Key</i> or a user-defined <i>Passphrase</i>. Creating a new key file\
 invalidates any previously downloaded key file for this dataset.\
 Delete any previous key file backups and back up the new key file.'),
    encryption_type_options: [
      { label: T('Key'), value: 'key' },
      { label: T('Passphrase'), value: 'passphrase' },
    ],
    algorithm_placeholder: T('Algorithm'),
    algorithm_tooltip: T('Mathematical instruction sets that determine how plaintext is converted \
     into ciphertext. See \
     <a href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard" target="_blank">Advanced Encryption Standard (AES)</a> \
     for more details.'),
    passphrase_placeholder: T('Passphrase'),
    passphrase_tooltip: T('User-defined string used to decrypt the dataset. Can be used instead of an encryption key.<br> \
     WARNING: the passphrase is the only means to decrypt the information stored in this dataset. Be sure to create a \
     memorable passphrase or physically secure the passphrase.'),
    passphrase_validation: [Validators.minLength(8)],
    confirm_passphrase_placeholder: T('Confirm Passphrase'),
    pbkdf2iters_placeholder: 'pbkdf2iters',
    pbkdf2iters_tooltip: T('Number of password-based key derivation function 2 (PBKDF2) iterations to use for reducing vulnerability \
     to brute-force attacks. Entering a number larger than <i>100000</i> is required. See \
     <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank">PBKDF2</a> for more details.'),
    pbkdf2iters_validation: [Validators.min(100000)],
    generate_key_checkbox_placeholder: T('Generate Key'),
    generate_key_checkbox_tooltip: T('Randomly generate an encryption key for securing this dataset. Disabling requires manually \
     defining the encryption key.<br> WARNING: the encryption key is the only means to decrypt the information stored in this \
     dataset. Store the encryption key in a secure location.'),
    key_placeholder: T('Key'),
    key_tooltip: T('Enter or paste a string to use as the encryption key for this dataset.'),
    key_validation: [Validators.minLength(64), Validators.maxLength(64)],
  },

};
