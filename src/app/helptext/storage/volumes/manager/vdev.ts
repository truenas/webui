import { T } from '../../../../translate-marker';

export default {
vdev_diskSizeErrorMsg : T('Mixing disks of different sizes in a VDEV is not allowed.'),
vdev_type_tooltip : T('Choose a <i>Stripe</i>, <i>Mirror</i>,\
 or <i>Raid-Z</i> configuration for the\
 chosen disk layout. See the <a\
 href="--docurl--/storage.html#pool-manager"\
 target="_blank">Pool Manager</a> section\
 of the guide for more details.'),
vdev_types : {
    'stripe' : T('Stripe'),
    'mirror' : T('Mirror'),
    'raidz'  : T('Raid-z'),
    'raidz2' : T('Raid-z2'),
    'raidz3' : T('Raid-z3')
  },
vdev_size_error: T('This type of VDEV requires at least '),
vdev_size_error_2: T(' disks')
}