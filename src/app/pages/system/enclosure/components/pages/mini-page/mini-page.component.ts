import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';
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
    private router: Router,
  ) {}

  protected readonly redirectOnNonMinis = effect(() => {
    const enclosure = this.store.selectedEnclosure();
    if (!enclosure) {
      return;
    }

    if (hasMiniSpecificPage(enclosure)) {
      return;
    }

    this.router.navigate(['/system', 'viewenclosure', enclosure.id]);
  }, { allowSignalWrites: true });
}
