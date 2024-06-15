import {
  ChangeDetectionStrategy, Component, ViewChild, computed,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { DashboardEnclosureSlotColored } from 'app/interfaces/enclosure.interface';
import { EnclosureView, OverviewInfo } from 'app/pages/system/enclosure/components/views/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide, enclosureComponentMap } from 'app/pages/system/enclosure/utils/enclosure-mappings';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-view',
  templateUrl: './enclosure-view.component.html',
  styleUrls: ['./enclosure-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureViewComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly enclosures = this.store.enclosures;
  readonly selectedSlot = this.store.selectedSlot;
  readonly EnclosureSide = EnclosureSide;
  protected readonly selectedView = signal<OverviewInfo['name']>(EnclosureView.Pools);
  readonly theme = toSignal(this.store$.select(selectTheme).pipe(
    filter(Boolean),
    map(() => this.themeService.currentTheme()),
  ));

  @ViewChild('enclosure') enclosureView: Element;
  protected readonly expanders = computed(() => {
    const expanders = this.enclosure().elements['SAS Expander'];
    return Object.values(expanders);
  });

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
    protected store$: Store<AppState>,
    private themeService: ThemeService,
  ) {}

  readonly dashboardView = computed(() => {
    const enclosure = this.enclosure();
    const selectedView = this.selectedView();
    const slotEntries = Object.entries(enclosure.elements['Array Device Slot']);
    const poolColors = new Map<string, string>();
    for (const [, slotData] of slotEntries) {
      const poolName = slotData.pool_info?.pool_name;
      if (selectedView === EnclosureView.Pools && poolName) {
        if (!poolColors.has(poolName)) {
          poolColors.set(poolName, this.theme().accentColors[Object.entries(poolColors).length]);
        }
        (slotData as DashboardEnclosureSlotColored).highlightColor = poolColors.get(poolName);
      } else if (selectedView === EnclosureView.FailedDisks) {
        if (slotData.status && slotData.status === 'OK') {
          (slotData as DashboardEnclosureSlotColored).highlightColor = 'green';
        } else {
          (slotData as DashboardEnclosureSlotColored).highlightColor = 'red';
        }
      } else {
        (slotData as DashboardEnclosureSlotColored).highlightColor = null;
      }
    }

    const selectedSide = this.selectedViewOption();
    // TODO: Add error handling for missing models
    const model = this.enclosure().model;
    return {
      component: enclosureComponentMap[model][selectedSide],
      inputs: {
        enclosure: { ...enclosure },
        enclosureSide: selectedSide,
      },
    };
  });

  readonly frontOrTopLoadedEnclosure = computed(() => {
    const enclosure = this.enclosure();
    return enclosure.top_loaded ? EnclosureSide.Top : EnclosureSide.Front;
  });

  readonly selectedViewOption = signal(this.frontOrTopLoadedEnclosure());

  changeView(viewName: OverviewInfo['name']): void {
    this.selectedView.set(viewName);
  }

  enclosureSelected(enclosureId: string): void {
    this.store.selectEnclosure(enclosureId);
  }
}
