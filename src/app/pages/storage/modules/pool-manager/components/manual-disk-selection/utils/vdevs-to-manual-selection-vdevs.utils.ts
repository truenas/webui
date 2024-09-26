import { UUID } from 'angular2-uuid';
import { omit } from 'lodash-es';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  ManualSelectionVdev,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/interfaces/manual-disk-selection.interface';

export function vdevsToManualSelectionVdevs(vdevs: DetailsDisk[][]): ManualSelectionVdev[] {
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

export function manualSelectionVdevsToVdevs(vdevs: ManualSelectionVdev[]): DetailsDisk[][] {
  return vdevs.map((vdev) => {
    return vdev.disks.map((disk) => {
      return omit(disk, ['vdevUuid', 'real_capacity']) as DetailsDisk;
    });
  });
}
