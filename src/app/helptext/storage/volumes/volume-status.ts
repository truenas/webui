import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';

export const helptextVolumeStatus = {
  dialogFormFields: {
    disk: {
      tooltip: T('Choose a new disk for the pool. To protect any existing data,\
 adding the selected disk is stopped when the disk is already in use or has partitions present.'),
    },
    force: {
      tooltip: T('Set to override safety checks and add the disk to the pool. <br>WARNING:\
 any data stored on the disk will be erased!'),
    },
    newDisk: {
      tooltip: T('Select an unused disk to add to this vdev. <br>WARNING: any data stored\
 on the unused disk will be erased!'),
    },
  },

  replaceDisk: {
    title: T('Replacing Disk'),
  },
  exportedPoolWarning: helptextPoolCreation.exportedPoolWarning,

  raidzExtendMessage: T('The expanded vdev uses the pre-expanded parity ratio, which reduces the total vdev capacity. \
To reset the vdev parity ratio and fully use the new capacity, manually rewrite all data in the vdev. \
This process takes time and is irreversible.'),
};
