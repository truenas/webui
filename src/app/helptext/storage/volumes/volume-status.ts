import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';

export const helptextVolumeStatus = {
  dialogFormFields: {
    disk: {
      placeholder: T('Member disk'),
      tooltip: T('Choose a new disk for the pool. To protect any existing data,\
 adding the selected disk is stopped when the disk is already in use or has partitions present.'),
    },
    force: {
      placeholder: T('Force'),
      tooltip: T('Set to override safety checks and add the disk to the pool. <br>WARNING:\
 any data stored on the disk will be erased!'),
    },
    new_disk: {
      placeholder: T('New Disk'),
      tooltip: T('Select an unused disk to add to this vdev. <br>WARNING: any data stored\
 on the unused disk will be erased!'),
    },
  },

  replace_disk: {
    title: T('Replacing Disk'),
    description: T('Replacing disk...'),
  },
  exported_pool_warning: helptextManager.exported_pool_warning,

  raidzExtendMessage: T('The expanded vdev uses the pre-expanded parity ratio, which reduces the total vdev capacity. \
To reset the vdev parity ratio and fully use the new capacity, manually rewrite all data in the vdev. \
This process takes time and is irreversible.'),
};
