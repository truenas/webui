import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export function getEnclosureLabel(enclosure: DashboardEnclosure): string {
  return enclosure.label === enclosure.name
    ? enclosure.model
    : enclosure.label;
}
