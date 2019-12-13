import {Validators} from '@angular/forms';
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
dataset_form_compression_tooltip: T('For more information about the available compression\
 algorithms, refer to the <a\
 href="--docurl--/storage.html#compression"\
 target="_blank">Compression section</a> of the guide.'),

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

dataset_form_quota_placeholder: 'Quota for this dataset and all children',
dataset_form_quota_tooltip: 'Define a maximum size for both the dataset and any child\
 datasets. Enter <i>0</i> to remove the quota.',

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
dataset_form_deduplication_tooltip: T('Please read about <a href="--docurl--/storage.html#deduplication"\
 target="_blank">deduplication</a> before considering\
 changing this setting.'),

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
dataset_form_aclmode_tooltip: T(''),

dataset_form_dataset_section_placeholder: T("This Dataset and Child Datasets"),
dataset_form_refdataset_section_placeholder: T("This Dataset"),
dataset_form_name_section_placeholder: T("Name and Options"),
dataset_form_other_section_placeholder: T("Other Options"),

dataset_form_inherit: T('Inherit'),
dataset_form_default: T('Default')
}
