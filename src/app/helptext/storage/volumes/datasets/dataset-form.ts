import {Validators} from '@angular/forms';
import { matchOtherValidator } from "app/pages/common/entity/entity-form/validators/password-validation";
import { T } from '../../../../translate-marker';

export default {
dataset_form_name_placeholder: T('Name'),
dataset_form_name_tooltip: T('Enter a unique name for the dataset.'),
dataset_form_name_validation: [Validators.required],

dataset_form_comments_placeholder: T('Comments'),
dataset_form_comments_tooltip: T('Enter any notes about this dataset.'),

dataset_form_sync_placeholder: T('Sync'),
dataset_form_sync_tooltip: T('<i>Standard</i> uses the sync settings that have been\
 requested by the client software, <i>Always</i> waits for\
 data writes to complete, and <i>Disabled</i> never waits for\
 writes to complete.'),

dataset_form_compression_placeholder: T('Compression level'),
dataset_form_compression_tooltip: T('Encode information in less space than the \
 original data occupies. It is recommended to choose a compression algorithm \
 that balances disk performance with the amount of saved space.<br> <i>LZ4</i> is \
 generally recommended as it maximizes performance and dynamically identifies \
 the best files to compress.<br> <i>GZIP</i> options range from 1 for least \
 compression, best performance, through 9 for maximum compression with \
 greatest performance impact.<br> <i>ZLE</i> is a fast algorithm that only \
 elminates runs of zeroes.'),

dataset_form_atime_placeholder: T('Enable Atime'),
dataset_form_atime_tooltip: T('Choose <i>ON</i> to update the access time for files\
 when they are read. Choose <i>Off</i> to prevent\
 producing log traffic when reading files. This can\
 result in significant performance gains.'),

dataset_form_share_type_placeholder: T('Share Type'),
dataset_form_share_type_tooltip: T('Choose the type that matches the type of client\
 accessing the pool/dataset.'),

dataset_form_refquota_placeholder: T('Quota for this dataset'),
dataset_form_refquota_tooltip: T('<i>0</i> disables quotas. Specify a maximum allowed\
 space for this dataset.'),

dataset_form_refquota_warning_placeholder: T('Quota warning alert at, %'),
dataset_form_refquota_warning_tooltip: T('Apply the same quota warning \
 alert settings as the parent dataset.'),
dataset_form_refquota_warning_validation: [Validators.min(0)],

dataset_form_refquota_critical_placeholder: T('Quota critical alert at, %'),
dataset_form_refquota_critical_tooltip: T('Apply the same quota critical \
 alert settings as the parent dataset.'),
dataset_form_refquota_critical_validation: [Validators.min(0)],

dataset_form_quota_placeholder: T('Quota for this dataset and all children'),
dataset_form_quota_tooltip: T('Define a maximum size for both the dataset and any child\
 datasets. Enter <i>0</i> to remove the quota.'),

dataset_form_quota_warning_placeholder: T('Quota warning alert at, %'),
dataset_form_quota_warning_tooltip: T('0=Disabled, blank=inherit'),
dataset_form_quota_warning_validation: [Validators.min(0)],

dataset_form_quota_critical_placeholder: T('Quota critical alert at, %'),
dataset_form_quota_critical_tooltip: T('0=Disabled, blank=inherit'),
dataset_form_quota_critical_validation: [Validators.min(0)],

dataset_form_refreservation_placeholder: T('Reserved space for this dataset'),
dataset_form_refreservation_tooltip: T('<i>0</i> is unlimited. Reserve additional space for\
 datasets containing logs which could take up all\
 available free space.'),

dataset_form_reservation_placeholder: T('Reserved space for this dataset and all children'),
dataset_form_reservation_tooltip: T('<i>0</i> is unlimited. A specified value applies to\
 both this dataset and any child datasets.'),

dataset_form_deduplication_label: T('ZFS deduplication'),
dataset_form_deduplication_placeholder: T('ZFS Deduplication'),
dataset_form_deduplication_tooltip: T('Transparently reuse a single copy of duplicated \
 data to save space. Deduplication can improve storage capacity, but is RAM intensive. \
 Compressing data is generally recommended before using deduplication. Deduplicating data is \
 a one-way process. <b>Deduplicated data cannot be undeduplicated!</b>.'),
dataset_form_deduplication_warning: T('This feature is memory-intensive and <b>permanently affects how the data is stored</b>. It is recommended to be very familiar with the benefits and drawbacks of deduplication before activating this feature.'),

dataset_form_readonly_placeholder: T('Read-only'),
dataset_form_readonly_tooltip: T('Set to prevent the dataset from being modified.'),

dataset_form_exec_placeholder: T('Exec'),
dataset_form_exec_tooltip: T('Set whether processes can be executed from within this dataset.'),

dataset_form_snapdir_placeholder: T('Snapshot directory'),
dataset_form_snapdir_tooltip: T('Choose if the .zfs snapshot directory is <i>Visible</i>\
 or <i>Invisible</i> on this dataset.'),

dataset_form_copies_placeholder: T('Copies'),
dataset_form_copies_tooltip: T('Set the number of data copies on this dataset.'),

dataset_form_recordsize_placeholder: T('Record Size'),
dataset_form_recordsize_tooltip: T('Matching the fixed size of data, as in a database, may\
 result in better performance.'),
dataset_form_warning_1: T('WARNING: Based on the pool topology, '),
dataset_form_warning_2: T(' is the minimum recommended record size. Choosing a smaller size can reduce system performance.'),

dataset_form_casesensitivity_placeholder: T('Case Sensitivity'),
dataset_form_casesensitivity_tooltip: T('<i>Sensitive</i> assumes filenames are case sensitive.\
 <i>Insensitive</i> assumes filenames are not case\
 sensitive. <i>Mixed</b> understands both types of\
 filenames.'),

dataset_form_aclmode_placeholder: T('ACL Mode'),
dataset_form_aclmode_tooltip: T('Determine how \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=chmod" target="_blank">chmod</a> \
 behaves when adjusting file ACLs. See the \
 <a href="https://www.freebsd.org/cgi/man.cgi?query=zfs" target="_blank">zfs(8)</a> aclmode property. \
 <br><br><i>Passthrough</i> only updates ACL entries that are related to the file or directory mode. \
 <br><br><i>Restricted</i> does not allow chmod to make changes to files or directories with a \
 non-trivial ACL. An ACL is trivial if it can be fully expressed as a file mode without losing \
 any access rules. Setting the ACL Mode to Restricted is typically used to optimize a dataset for \
 SMB sharing, but can require further optimizations. For example, configuring an rsync task with this \
 dataset could require adding <i>--no-perms</i> in the task <i>Auxiliary Parameters</i> field.'),

dataset_form_dataset_section_placeholder: T("This Dataset and Child Datasets"),
dataset_form_refdataset_section_placeholder: T("This Dataset"),
dataset_form_name_section_placeholder: T("Name and Options"),
dataset_form_other_section_placeholder: T("Other Options"),

dataset_form_inherit: T('Inherit'),
dataset_form_default: T('Default'),

dataset_form_quota_too_small: T("Quota size is too small, enter a value of 1 GiB or larger."),

dataset_form_special_small_blocks_placeholder: T('Metadata (Special) Small Block Size'),
dataset_form_special_small_blocks_tooltip: T('This value represents the threshold block size\
 for including small file blocks into the special allocation class. Blocks smaller than or\
 equal to this value will be assigned to the special allocation class while greater blocks\
 will be assigned to the regular class. Valid values are zero or a power of two from 512B \
 up to 1M. The default size is 0 which means no small file blocks will be allocated in the\
 special class. Before setting this property, a special class vdev must be added to the pool.\
 See <a href="https://zfsonlinux.org/manpages/0.7.13/man8/zpool.8.html" target="_blank">zpool(8)</a> for more details on the special allocation'),

dataset_form_encryption: {
    fieldset_title: T('Encryption Options'),
    inherit_checkbox_placeholder: T('Inherit'),
    inherit_checkbox_notencrypted: T('Inherit (non-encrypted)'),
    inherit_checkbox_encrypted: T('Inherit (encrypted)'),
    inherit_checkbox_tooltip: T('Use the encryption properties of the root dataset.'),
    encryption_checkbox_placeholder: T('Encryption'),
    encryption_checkbox_tooltip: T('Secure data within this dataset. Data is unusable until \
     unlocked with an encryption key or passphrase.'),
    encryption_type_placeholder: T('Encryption Type'),
    encryption_type_tooltip: T('How the dataset is secured. Choose between securing with\
 an encryption <i>Key</i> or a user-defined <i>Passphrase</i>. Creating a new key file\
 invalidates any previously downloaded key file for this dataset.\
 Delete any previous key file backups and back up the new key file.'),
    encryption_type_options: [
        {label: T('Key'), value: 'key'},
        {label: T('Passphrase'), value: 'passphrase'}
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
    confirm_passphrase_validation: [matchOtherValidator("passphrase")],
    pbkdf2iters_placeholder: T('pbkdf2iters'),
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
    non_encrypted_warning_title: T('Warning'),
    non_encrypted_warning_warning: T('All data stored in this dataset will be decrypted and the dataset marked \
 as non-encrypted. Do you want to continue?'),
},
    afterSubmitDialog: {
        title: T('Set ACL for this dataset'),
        message: T('The parent of this dataset has an Access Control List (ACL). Do you want to set an ACL for this \
dataset using the ACL Manager? '), 
        actionBtn: T('Go to ACL Manager'),
        cancelBtn: T('Return to pool list')
    }
}
