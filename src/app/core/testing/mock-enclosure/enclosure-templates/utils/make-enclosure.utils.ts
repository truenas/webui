import { EnclosureStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';

export interface MockEnclosureSettings {
  model: string;
  controller: boolean;
  rackmount: boolean;
  top_loaded?: boolean;
  front_loaded?: boolean;
  front_slots?: number;
  rear_slots?: number;
  internal_slots?: number;
  top_slots?: number;
  elements: DashboardEnclosure['elements'];
}

export function makeEnclosure(settings: MockEnclosureSettings): DashboardEnclosure {
  return {
    name: `${settings.model}_enclosure`,
    model: settings.model,
    controller: settings.controller,
    dmi: `TRUENAS-${settings.model}`,
    label: settings.model,
    status: [EnclosureStatus.Ok],
    id: `5b0bd6d1a30714bf_${settings.model}`,
    vendor: 'iX',
    product: '4024Sp',
    revision: 'c205',
    bsg: '/dev/bsg/0:0:23:0',
    sg: '/dev/sg25',
    pci: '0:0:23:0',
    rackmount: settings.rackmount,
    top_loaded: settings.top_loaded ?? false,
    front_loaded: settings.front_loaded ?? false,
    front_slots: settings.front_slots ?? 0,
    rear_slots: settings.rear_slots ?? 0,
    top_slots: settings.top_slots ?? 0,
    internal_slots: settings.internal_slots ?? 0,
    elements: settings.elements,
  } as DashboardEnclosure;
}
