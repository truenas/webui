import { UUID } from 'angular2-uuid';
import _ from 'lodash';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';

export function vdevsToManualSelectionVdevs(vdevs: UnusedDisk[][]): ManualSelectionVdev[] {
  return vdevs.map((vdev) => {
    const vdevId = UUID.UUID();
    return {
      disks: vdev.map((disk) => {
        return {
          ...disk,
          vdevUuid: vdevId,
          real_capacity: 0,
        };
      }),
      uuid: vdevId,
    };
  });
}

export function manualSelectionVdevsToVdevs(vdevs: ManualSelectionVdev[]): UnusedDisk[][] {
  return vdevs.map((vdev) => {
    return vdev.disks.map((disk) => {
      return _.omit(disk, ['vdevUuid', 'real_capacity']) as UnusedDisk;
    });
  });
}
