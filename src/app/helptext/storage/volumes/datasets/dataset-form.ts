import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export const helptextDatasetForm = {
  dataset_parent_name_tooltip: T('Parent dataset path (read-only).'),
  dataset_form_name_tooltip: T('Enter a unique name for the dataset. The dataset name length is calculated by adding the length of this field\'s value and the length of the parent path field value. The length of \'Parent Path\' and \'Name\' added together cannot exceed 200 characters. Because of this length validation on this field accounts for the parent path as well. Furthermore, the maximum nested directory levels allowed is 50. You can\'t create a dataset that\'s at the 51st level in the directory hierarchy after you account for the nested levels in the parent path.'),
  dataset_form_comments_tooltip: T('Enter any notes about this dataset.'),
  dataset_form_sync_tooltip: T('<i>Standard</i> uses the sync settings that have been\
 requested by the client software, <i>Always</i> waits for\
 data writes to complete, and <i>Disabled</i> never waits for\
 writes to complete.'),
  dataset_form_sync_disabled_warning: T('TrueNAS recommends that the sync setting always \
 be left to the default of "Standard" or increased to "Always". The "Disabled" setting should \
 not be used in production and only where data roll back by few seconds \
 in case of crash or power loss is not a concern.'),
  dataset_form_compression_tooltip: T('Encode information in less space than the \
 original data occupies. It is recommended to choose a compression algorithm \
 that balances disk performance with the amount of saved space.<br> <i>LZ4</i> is \
 generally recommended as it maximizes performance and dynamically identifies \
 the best files to compress.<br> <i>GZIP</i> options range from 1 for least \
 compression, best performance, through 9 for maximum compression with \
 greatest performance impact.<br> <i>ZLE</i> is a fast algorithm that only \
 eliminates runs of zeroes.'),
  dataset_form_atime_tooltip: T('Choose <i>ON</i> to update the access time for files\
 when they are read. Choose <i>Off</i> to prevent\
 producing log traffic when reading files. This can\
 result in significant performance gains.'),
  dataset_form_dataset_preset_tooltip: T('Choose the type that matches the type of client\
 accessing the pool/dataset.'),
  dataset_form_refquota_tooltip: T('<i>0</i> disables quotas. Specify a maximum allowed\
 space for this dataset.'),
  acl_type_change_warning: T('Changes to ACL type affect how on-disk ZFS ACL is \
 written and read.\nWhen the ACL type is changed from POSIX to NFSv4, \
 no migration is performed for default and access ACLs encoded in the \
 posix1e acl extended attributes to native ZFS ACLs.\nWhen ACL type is \
 changed from NFSv4 to POSIX, native ZFS ACLs are not converted to \
 posix1e extended attributes, but the native ACL will be used internally \
 by ZFS for access checks.\n\nThis means that the user must manually set \
 new ACLs recursively on the dataset after ACL type changes in order to \
 avoid unexpected permissions behavior.\n\nThis action will be destructive, \
 and so it is advised to take a ZFS snapshot of the dataset prior to ACL \
 type changes and permissions modifications.'),
  dataset_form_refquota_warning_tooltip: T('Apply the same quota warning \
 alert settings as the parent dataset.'),
  dataset_form_refquota_critical_tooltip: T('Apply the same quota critical \
 alert settings as the parent dataset.'),
  dataset_form_quota_tooltip: T('Define a maximum size for both the dataset and any child\
 datasets. Enter <i>0</i> to remove the quota.'),
  dataset_form_quota_warning_tooltip: T('0=Disabled, blank=inherit'),
  dataset_form_quota_critical_tooltip: T('0=Disabled, blank=inherit'),
  dataset_form_refreservation_tooltip: T('<i>0</i> is unlimited. Reserve additional space for\
 datasets containing logs which could take up all\
 available free space.'),
  dataset_form_reservation_tooltip: T('<i>0</i> is unlimited. A specified value applies to\
 both this dataset and any child datasets.'),
  dataset_form_deduplication_tooltip: T('Transparently reuse a single copy of duplicated \
 data to save space. Deduplication can improve storage capacity, but is RAM intensive. \
 Compressing data is generally recommended before using deduplication. Deduplicating data is \
 a one-way process. <b>Deduplicated data cannot be undeduplicated!</b>.'),
  dataset_form_deduplication_warning: T('This feature is memory-intensive and <b>permanently affects how the data is stored</b>. It is recommended to be very familiar with the benefits and drawbacks of deduplication before activating this feature.'),

  deduplicationWarning: T('Deduplication is experimental in 24.10 and not fully supported. When enabled, data is permanently stored with this memory-intensive method and cannot be undone. Take extreme caution and ensure you have adequate data backups before enabling this feature.'),
  deduplicationChecksumWarning: T(`The default "Checksum" value for datasets with deduplication used to be SHA256.
       Our testing has shown that SHA512 performs better for such datasets.
       We've changed the checksum value from SHA256 to SHA512. You can change it back in "Advanced Options".`),

  deduplicationChecksumInlineWarning: T('For performance reasons SHA512 is recommended over SHA256 for datasets with deduplication enabled.'),

  dataset_form_readonly_tooltip: T('Set to prevent the dataset from being modified.'),

  dataset_form_exec_tooltip: T('Set whether processes can be executed from within this dataset.'),

  dataset_form_snapdir_tooltip: T('Choose if the .zfs snapshot directory is <i>Visible</i>\
 or <i>Invisible</i> on this dataset.'),

  dataset_form_snapdev_tooltip: T('Controls whether the volume snapshot devices under /dev/zvol/⟨pool⟩ \
 are hidden or visible. The default value is hidden.'),

  dataset_form_copies_tooltip: T('Set the number of data copies on this dataset.'),

  dataset_form_recordsize_tooltip: T('Matching the fixed size of data, as in a database, may\
 result in better performance.'),
  dataset_form_warning: T(
    'WARNING: Based on the pool topology, {size} is the minimum recommended record size. Choosing a smaller size can reduce system performance.',
  ),

  dataset_form_casesensitivity_tooltip: T('<i>Sensitive</i> assumes filenames are case sensitive.\
 <i>Insensitive</i> assumes filenames are not case\
 sensitive.'),

  dataset_form_aclmode_tooltip: T('Determine how \
 <a href="https://man7.org/linux/man-pages/man1/chmod.1.html" target="_blank">chmod</a> \
 behaves when adjusting file ACLs. See the \
 <a href="https://linux.die.net/man/8/zfs" target="_blank">zfs(8)</a> aclmode property. \
 <br><br><i>Passthrough</i> only updates ACL entries that are related to the file or directory mode. \
 <br><br><i>Restricted</i> does not allow chmod to make changes to files or directories with a \
 non-trivial ACL. An ACL is trivial if it can be fully expressed as a file mode without losing \
 any access rules. Setting the ACL Mode to Restricted is typically used to optimize a dataset for \
 SMB sharing, but can require further optimizations. For example, configuring an rsync task with this \
 dataset could require adding <i>--no-perms</i> in the task <i>Auxiliary Parameters</i> field.'),

  dataset_form_quota_too_small: T('Quota size is too small, enter a value of 1 GiB or larger.'),

  dataset_form_special_small_blocks_tooltip: T('This value represents the threshold block size\
 for including small file blocks into the special allocation class. Blocks smaller than or\
 equal to this value will be assigned to the special allocation class while greater blocks\
 will be assigned to the regular class. Valid values are zero or a power of two from 512B \
 up to 1M. The default size is 0 which means no small file blocks will be allocated in the\
 special class. Before setting this property, a special class vdev must be added to the pool.\
 See <a href="https://zfsonlinux.org/manpages/0.7.13/man8/zpool.8.html" target="_blank">zpool(8)</a> for more details on the special allocation'),

  dataset_form_preset: {
    generic: T('Generic dataset suitable for any share type.'),
    smb: T('SMB preset sets most optimal settings for SMB sharing.'),
    multiprotocol: T('Configured for simultaneous use with SMB and NFS on the same dataset.'),
    apps: T('Dataset for use by an application. If you plan to deploy container applications,\
 the system automatically creates the ix-apps dataset but this is not used for application data storage.'),
    smb_description: T('By clicking the share creation checkbox below, a new share will be created on form submission with the default\
 share settings Additionally, local TrueNAS users will have access to the resulting share and some more configuration options will be available.'),
  },

  dataset_form_encryption: {
    inherit_checkbox_tooltip: T('Use the encryption properties of the root dataset.'),
    encryption_checkbox_tooltip: T('Secure data within this dataset. Data is unusable until \
     unlocked with an encryption key or passphrase. If parent dataset has encryption enabled, it is \
     not possible to disable this option.'),
    encryption_type_tooltip: T('How the dataset is secured. Choose between securing with\
 an encryption <i>Key</i> or a user-defined <i>Passphrase</i>. Creating a new key file\
 invalidates any previously downloaded key file for this dataset.\
 Delete any previous key file backups and back up the new key file.'),
    encryption_type_options: [
      { label: T('Key'), value: 'key' },
      { label: T('Passphrase'), value: 'passphrase' },
    ],
    algorithm_tooltip: T('Mathematical instruction sets that determine how plaintext is converted \
     into ciphertext. See \
     <a href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard" target="_blank">Advanced Encryption Standard (AES)</a> \
     for more details.'),
    passphrase_tooltip: T('User-defined string used to decrypt the dataset. Can be used instead of an encryption key.<br> \
     WARNING: the passphrase is the only means to decrypt the information stored in this dataset. Be sure to create a \
     memorable passphrase or physically secure the passphrase.'),
    confirm_passphrase_placeholder: T('Confirm Passphrase'),
    pbkdf2iters_tooltip: T('Number of password-based key derivation function 2 (PBKDF2) iterations to use for reducing vulnerability \
     to brute-force attacks. Entering a number larger than <i>100000</i> is required. See \
     <a href="https://en.wikipedia.org/wiki/PBKDF2" target="_blank">PBKDF2</a> for more details.'),
    generate_key_checkbox_tooltip: T('Randomly generate an encryption key for securing this dataset. Disabling requires manually \
     defining the encryption key.<br> WARNING: the encryption key is the only means to decrypt the information stored in this \
     dataset. Store the encryption key in a secure location.'),
    key_tooltip: T('Enter or paste a string to use as the encryption key for this dataset.'),
  },
  pathWarningTitle: T('Action Not Possible'),
  pathIsTooLongWarning: T('Dataset name is set by appending the parent path with the name entered by you. The max allowed length for the dataset name is 200. The parent path for this dataset already exceeds that limit. It is not possible to create anymore nested datasets under this path.'),
  pathIsTooDeepWarning: T('Max dataset nesting in ZFS is limited to 50. We are already at that limit in the parent dataset path. It is not possible to create anymore nested datasets under this path.'),

  afterSubmitDialog: {
    title: T('Set ACL for this dataset'),
    message: T('The parent of this dataset has an Access Control List (ACL). Do you want to set an ACL for this \
dataset using the ACL Manager? '),
    actionBtn: T('Go to ACL Manager'),
    cancelBtn: T('Return to pool list'),
  },
};
