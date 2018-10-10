import { T } from '../../../translate-marker';

export default {
  disk_name_placeholder: T('Name'),
  disk_name_tooltip : T('Disk to wipe.'),

  wipe_method_placeholder: T('Method'),
  wipe_method_tooltip : T('<i>Quick</i> erases only the partitioning information\
                     on a disk without clearing other old data. <i>Full\
                     with zeros</i> overwrites the entire disk with zeros.\
                     <i>Full with random data</i> overwrites the entire\
                     disk with random binary data.')
}