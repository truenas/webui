import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input, TrackByFunction,
} from '@angular/core';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Component({
  selector: 'ix-m50-enclosure-view',
  templateUrl: './m50-enclosure-view.component.svg',
  styleUrl: './m50-enclosure-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50EnclosureViewComponent {
  readonly enclosure = input.required<DashboardEnclosure>();
  readonly selectedSlot = input.required<DashboardEnclosureSlot>();
  protected readonly selectedSlotIndex = computed(() => {
    const selectedSlot = this.selectedSlot();
    if (!selectedSlot) {
      return -1;
    }
    return selectedSlot.drive_bay_number - 1;
  });

  protected readonly trackByNumber: TrackByFunction<KeyValue<string, DashboardEnclosureSlot>> = (_, slot) => slot.key;

  protected readonly slots = computed<Record<number, DashboardEnclosureSlot>>(() => {
    const enclosure = this.enclosure();
    return enclosure.elements[EnclosureElementType.ArrayDeviceSlot];
  });

  constructor(
    private enclosureStore: EnclosureStore,
  ) { }

  protected onTraySelected(slotIndex: number): void {
    const driveBayNumber = slotIndex + 1;
    const slots = this.slots();
    this.enclosureStore.selectSlot({ ...slots[driveBayNumber], drive_bay_number: driveBayNumber });
  }
}
