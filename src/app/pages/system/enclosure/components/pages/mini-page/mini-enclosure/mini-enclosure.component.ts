import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
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

  constructor(
    private store: EnclosureStore,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    // For Minis view, selecting an empty slot is akin to unselecting the slot.
    if (!slot.dev) {
      this.store.selectSlot(null);
    }

    this.store.selectSlot(slot);
  }

  protected poolTint: TintingFunction = (slot) => {
    // TODO: Not implemented
    return slot.pool_info ? 'blue' : null;
  };

  readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });
}
