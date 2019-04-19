import {Validators} from '@angular/forms';
import { T } from '../../../translate-marker';

export default {
import_disk_volume_placeholder : T('Disk'),
import_disk_volume_tooltip: T('Select the disk to import. The import will copy the\
 data from the chosen disk to an existing ZFS dataset.\
 Only one disk can be imported at a time.'),
import_disk_volume_validation : [ Validators.required ],

import_disk_fs_type_placeholder : T('Filesystem type'),
import_disk_fs_type_tooltip: T('Choose the type of filesystem on the disk. Refer to\
 the guide section on <a\
 href="%%docurl%%/storage.html#import-disk"\
 target="_blank">importing disks</a> for more details.'),
import_disk_fs_type_validation : [ Validators.required ],


import_disk_msdosfs_locale_placeholder: T('MSDOSFS locale'),
import_disk_msdosfs_locale_tooltip: T('Select the locale for the MSDOSFS device to see files\
 of that locale properly'),

import_disk_dst_path_placeholder : T('Destination Path'),
import_disk_dst_path_tooltip: T('Browse to the ZFS dataset that will hold the copied data.'),
import_disk_dst_path_validation : [ Validators.required ]
}