import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

export function getDefaultSide(enclosure: DashboardEnclosure): EnclosureSide {
  return enclosure?.top_loaded ? EnclosureSide.Top : EnclosureSide.Front;
}
