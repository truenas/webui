import { UUID } from 'angular2-uuid';
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
      rawSize: 0,
    };
  });
}

// TODO: Do something about extra fields.
export function manualSelectionVdevsToVdevs(vdevs: ManualSelectionVdev[]): UnusedDisk[][] {
  return vdevs.map((vdev) => {
    return vdev.disks;
  });
}
