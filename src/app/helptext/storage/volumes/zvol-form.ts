import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
zvol_name_placeholder: T('zvol name:'),
zvol_name_tooltip: T('Keep the zvol name short. Using a zvol name longer\
 than 63 characters can prevent accessing the zvol as a device.'),
zvol_name_validation: [Validators.required],

zvol_comments_placeholder: T('Comments'),
zvol_comments_tooltip: T('Add any notes about this zvol.'),

zvol_volsize_placeholder: T('Size for this zvol'),
zvol_volsize_tooltip : T('Specify a size and value such as <i>10 GiB</i>.'),
zvol_volsize_validation: [Validators.required, Validators.min(0)],

zvol_forcesize_placeholder: T('Force size'),
zvol_forcesize_tooltip : T('The system restricts creating a zvol that brings the\
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
zvol_compression_tooltip: T('Automatically compress data written to the zvol.\
 Choose a <a href="%%docurl%%/storage.html#compression"\
 target="_blank">compression algorithm</a>.'),
zvol_compression_validation: [Validators.required],

zvol_deduplication_placeholder: T('ZFS Deduplication'),
zvol_deduplication_tooltip : T('Activates the process for ZFS to transparently reuse\
 a single copy of duplicated data to save space. The\
 <a href="%%docurl%%/storage.html#deduplication"\
 target="_blank">Deduplication section</a> of the Guide\
 describes each option.'),
zvol_deduplication_validation: [Validators.required],

zvol_sparse_placeholder: T('Sparse'),
zvol_sparse_tooltip : T('Set to provide <a\
 href="https://searchstorage.techtarget.com/definition/thin-provisioning"\
 target="_blank">thin provisioning</a>.\
 <b>Caution:</b> writes can fail when the pool is low on space.'),

zvol_volblocksize_placeholder: T('Block size'),
zvol_volblocksize_tooltip: T('The zvol default block size is automatically chosen\
 based on the number of the disks in the pool for a\
 general use case.'),
}