import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextZvol = {
  addTitle: T('Add Zvol'),
  editTitle: T('Edit Zvol'),
  nameLabel: T('Name'),
  nameTooltip: T('Keep the zvol name short. Using a zvol name longer\
 than 63 characters can prevent accessing the zvol as a device.'),

  commentsLabel: T('Comments'),

  sizeLabel: T('Size'),
  sizeTooltip: T('Specify a size and value such as <i>10 GiB</i>.'),

  forceSizeLabel: T('Force size'),
  forceSizeTooltip: T('The system restricts creating a zvol that brings the\
 pool to over 80% capacity. Set to force creation of\
 the zvol (<b>NOT Recommended</b>).'),

  syncLabel: T('Sync'),
  syncTooltip: T('Sets the data write synchronization. <i>Inherit</i>\
 takes the sync settings from the parent dataset,\
 <i>Standard</i> uses the settings that have been\
 requested by the client software, <i>Always</i> waits\
 for data writes to complete, and <i>Disabled</i> never\
 waits for writes to complete.'),

  compressionLabel: T('Compression'),
  compressionTooltip: T('Encode information in less space than the \
 original data occupies. It is recommended to choose a compression algorithm \
 that balances disk performance with the amount of saved space.<br> <i>LZ4</i> is \
 generally recommended as it maximizes performance and dynamically identifies \
 the best files to compress.<br> <i>GZIP</i> options range from 1 for least \
 compression, best performance, through 9 for maximum compression with \
 greatest performance impact.<br> <i>ZLE</i> is a fast algorithm that only \
 eliminates runs of zeroes.'),

  deduplicationLabel: T('ZFS Deduplication'),
  deduplicationTooltip: T('Transparently reuse a single copy of duplicated \
 data to save space. Deduplication can improve storage capacity, but is RAM intensive. \
 Compressing data is generally recommended before using deduplication. Deduplicating data is \
 a one-way process. <b>Deduplicated data cannot be undeduplicated!</b>.'),

  readonlyLabel: T('Read-only'),
  readonlyTooltip: T('Set to prevent the zvol from being modified.'),

  sparseLabel: T('Sparse'),
  sparseTooltip: T('Enable to use thin provisioning\
 where disk space for this volume is allocated <b>‘on demand’</b> as new writes are received.\
 Use caution when enabling this feature, as writes can fail when the pool is low on space.'),

  volblocksizeLabel: T('Block size'),
  volblocksizeTooltip: T('The zvol default block size is automatically chosen\
 based on the number of the disks in the pool for a\
 general use case.'),

  blocksizeWarning: {
    a: T('Recommended block size based on pool topology:'),
    b: T('A smaller block size can reduce sequential I/O performance and space efficiency.'),
  },
  zvolSaveError: {
    title: T('Error saving ZVOL.'),
    msg: T('Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.'),
  },

  encryption: {
    title: T('Encryption'),
    inheritLabel: T('Inherit'),
    inheritNotEncrypted: T('Inherit (non-encrypted)'),
    inheritEncrypted: T('Inherit (encrypted)'),
    inheritTooltip: T('Use the encryption properties of the root dataset.'),
    encryptionLabel: T('Encryption'),
    encryptionTooltip: T('Secure data within this dataset. Data is unusable until \
     unlocked with an encryption key or passphrase. If parent dataset has encryption enabled,\
     it is not possible to disable this option.'),
    encryptionTypeLabel: T('Encryption Type'),
    encryptionTypeTooltip: T('How the dataset is secured. Choose between securing with\
 an encryption <i>Key</i> or a user-defined <i>Passphrase</i>. Creating a new key file\
 invalidates any previously downloaded key file for this dataset.\
 Delete any previous key file backups and back up the new key file.'),
    algorithmLabel: T('Algorithm'),
    algorithmTooltip: T('Mathematical instruction sets that determine how plaintext is converted \
     into ciphertext. See \
     <a href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard" target="_blank">Advanced Encryption Standard (AES)</a> \
     for more details.'),
    passphraseLabel: T('Passphrase'),
    passphraseTooltip: T('User-defined string used to decrypt the dataset. Can be used instead of an encryption key.<br> \
     WARNING: the passphrase is the only means to decrypt the information stored in this dataset. Be sure to create a \
     memorable passphrase or physically secure the passphrase.'),
    confirmPassphraseLabel: T('Confirm Passphrase'),
    pbkdf2itersLabel: 'pbkdf2iters',
    pbkdf2itersTooltip: T('Number of password-based key derivation function 2 (PBKDF2) iterations to use for reducing vulnerability \
     to brute-force attacks. Entering a number larger than <i>100000</i> is required. See \
     <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank">PBKDF2</a> for more details.'),
    generateKeyLabel: T('Generate Key'),
    generateKeyTooltip: T('Randomly generate an encryption key for securing this dataset. Disabling requires manually \
     defining the encryption key.<br> WARNING: the encryption key is the only means to decrypt the information stored in this \
     dataset. Store the encryption key in a secure location.'),
    keyLabel: T('Key'),
    keyTooltip: T('Enter or paste a string to use as the encryption key for this dataset.'),
  },

  useSpecialVdevsTooltip: T('Enable to store data in special metadata vdevs. \
When enabled, you can customize the threshold size that determines which blocks are stored in special vdevs. \
Before enabling this option, ensure a special/metadata vdev has been added to the pool.'),

  specialSmallBlocksCustomTooltip: T('Specify the threshold size for storing data in special vdevs. \
Data blocks smaller than or equal to this value will be stored in special vdevs, while larger blocks will use regular vdevs. \
Valid range is 1 byte to 16 MiB. You can enter values like "128K", "1M", "4096", etc.'),
};
