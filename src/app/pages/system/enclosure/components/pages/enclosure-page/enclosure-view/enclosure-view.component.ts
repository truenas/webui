import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  TintingFunction,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

@Component({
  selector: 'ix-enclosure-view',
  templateUrl: './enclosure-view.component.html',
  styleUrl: './enclosure-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureViewComponent {
  readonly enclosure = input.required<DashboardEnclosure>();

  readonly selectedView = this.enclosureStore.selectedView;
  readonly selectedSlot = this.enclosureStore.selectedSlot;
  readonly selectedSide = this.enclosureStore.selectedSide;

  // TODO: Simplify in ThemeService.
  readonly theme = toSignal(this.store$.select(selectTheme).pipe(
    filter(Boolean),
    map(() => this.themeService.currentTheme()),
  ));

  constructor(
    private store$: Store<AppState>,
    private enclosureStore: EnclosureStore,
    private themeService: ThemeService,
  ) {}

  protected onSlotSelected(slot: DashboardEnclosureSlot): void {
    this.enclosureStore.selectSlot(slot);
  }

  readonly slotTintFn = computed(() => {
    if (this.selectedView() === EnclosureView.DiskStatus) {
      return this.diskStatusTint();
    }

    return this.poolTint();
  });

  private diskStatusTint(): TintingFunction {
    return (slot: DashboardEnclosureSlot) => {
      return slot?.status === 'OK' ? 'green' : 'red';
    };
  }

  // TODO: Pool colors need to stay consistent across multiple enclosures, so this needs to be moved to store.
  // TODO: See if we can use css variables for colors instead of setting a specific color.
  private poolTint(): TintingFunction {
    const poolColors = new Map<string, string>();
    return (slot: DashboardEnclosureSlot) => {
      const poolName = slot.pool_info?.pool_name;
      if (poolName) {
        if (!poolColors.has(poolName)) {
          poolColors.set(poolName, this.theme().accentColors[Object.entries(poolColors).length]);
        }
        return poolColors.get(poolName);
      }
      return null;
    };
  }
}
