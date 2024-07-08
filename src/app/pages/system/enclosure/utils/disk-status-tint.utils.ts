import { EnclosureDiskStatus } from 'app/enums/enclosure-slot-status.enum';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';

export const diskStatusTint: TintingFunction = (slot) => {
  if (!slot.pool_info) {
    return null;
  }

  switch (slot.pool_info.disk_status) {
    case EnclosureDiskStatus.Online:
      return 'var(--green)';
    case EnclosureDiskStatus.Degraded:
      return 'var(--orange)';
    case EnclosureDiskStatus.Faulted:
      return 'var(--red)';
    case EnclosureDiskStatus.Unknown:
      return 'var(--yellow)';
    default:
      return 'var(--grey)';
  }
};
