import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input, TrackByFunction,
} from '@angular/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureComponent } from 'app/pages/system/enclosure/interfaces/enclosure-component.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-m50-enclosure',
  templateUrl: './m50-enclosure.component.svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50EnclosureComponent implements EnclosureComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();

  readonly trackByNumber: TrackByFunction<KeyValue<string, DashboardEnclosureSlot>> = (_, slot) => slot.key;

  readonly slots = computed(() => this.enclosure().elements[EnclosureElementType.ArrayDeviceSlot]);

  getDriveTrayTransformation(slotNumber: string): string {
    const number = Number(slotNumber);
    const xOffset = -0.001 + (((number - 1) % 4) * 125);
    const yOffset = Math.floor((number - 1) / 4) * 33;
    return `translate(${xOffset} ${yOffset})`;
  }

  constructor(
    private enclosureStore: EnclosureStore,
  ) {
  }

  onTraySelected(slot: DashboardEnclosureSlot): void {
    this.enclosureStore.selectSlot(slot);
  }
}
