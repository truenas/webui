import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

@Component({
  selector: 'ix-mini-page',
  templateUrl: './mini-page.component.html',
  styleUrls: ['./mini-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniPageComponent {
  readonly enclosureLabel = this.store.enclosureLabel;
  readonly selectedSlot = this.store.selectedSlot;
  readonly isLoading = this.store.isLoading;

  readonly slots = computed(() => {
    return getSlotsOfSide(this.store.selectedEnclosure(), EnclosureSide.Front);
  });

  constructor(
    private store: EnclosureStore,
  ) {}
}
