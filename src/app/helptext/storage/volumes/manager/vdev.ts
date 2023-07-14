import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export default {
  vdev_diskSizeErrorMsg: T('Mixing disks of different sizes in a VDEV is not recommended.'),
  vdev_type_tooltip: T('Arrange the disks according to capacity, redundancy, and \
 performance considerations. More types become available as more disks are added to the vdev.<br> \
 A <i>Stripe</i> uses the entire capacity of the disks for storage and <b>has no redundancy</b>. \
 Failed or degraded disks in a stripe can result in data loss!<br> A <i>Mirror</i> requires at \
 least two disks and mirrors the data from one disk onto each other disk in the vdev, which can \
 limit the total capacity.<br><i>Raid-Z</i> configurations offer different balances of data \
 redundancy and total capacity for the selected disks.'),
  vdev_types: {
    stripe: T('Stripe'),
    mirror: T('Mirror'),
    raidz: 'Raid-z',
    raidz2: 'Raid-z2',
    raidz3: 'Raid-z3',
  },
};
