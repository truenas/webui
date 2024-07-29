import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { makePoolTintFunction } from 'app/pages/system/enclosure/utils/make-pool-tint-function.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

@Component({
  selector: 'ix-mini-enclosure',
  templateUrl: './mini-enclosure.component.html',
  styleUrl: './mini-enclosure.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniEnclosureComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedSlot = this.store.selectedSlot;

  readonly poolTint = computed(() => {
    return makePoolTintFunction(this.store.poolColors());
  });

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    // For Minis view, selecting an empty slot is akin to unselecting the slot.
    if (!slot.dev) {
      this.store.selectSlot(null);
      return;
    }

    this.store.selectSlot(slot.drive_bay_number);
  }

  readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });
}
