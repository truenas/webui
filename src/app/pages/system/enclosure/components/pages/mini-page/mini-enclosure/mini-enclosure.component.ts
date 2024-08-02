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

  protected onSlotSelected(slot: DashboardEnclosureSlot | null): void {
    this.store.selectSlot(slot ? slot.drive_bay_number : null);
  }

  readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });
}
