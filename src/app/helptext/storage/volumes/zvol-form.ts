import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
zvol_name_placeholder: T('Zvol name'),
zvol_name_tooltip: T('Keep the zvol name short. Using a zvol name longer\
 than 63 characters can prevent accessing the zvol as a device.'),

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
zvol_compression_tooltip: T('Encode information in less space than the \
 original data occupies. It is recommended to choose a compression algorithm \
 that balances disk performance with the amount of saved space.<br> <i>LZ4</i> is \
 generally recommended as it maximizes performance and dynamically identifies \
 the best files to compress.<br> <i>GZIP</i> options range from 1 for least \
 compression, best performance, through 9 for maximum compression with \
 greatest performance impact.<br> <i>ZLE</i> is a fast algorithm that only \
 elminates runs of zeroes.'),
zvol_compression_validation: [Validators.required],

zvol_deduplication_placeholder: T('ZFS Deduplication'),
zvol_deduplication_tooltip : T('Transparently reuse a single copy of duplicated \
 data to save space. Deduplication can improve storage capacity, but is RAM intensive. \
 Compressing data is generally recommended before using deduplication. Deduplicating data is \
 a one-way process. <b>Deduplicated data cannot be undeduplicated!</b>.'),
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

zvol_volsize_zero_error: T('Volume size cannot be zero.'),
zvol_volsize_shrink_error: T('Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.'),

blocksize_warning: {
    a: T('Recommended block size based on pool topology:'),
    b: T('A smaller block size can reduce sequential I/O performance and space efficiency.')
},
zvol_save_errDialog: {
    title: T('Error saving ZVOL.'),
    msg: T('Shrinking a ZVOL is not allowed in the User Interface. This can lead to data loss.')
}
}