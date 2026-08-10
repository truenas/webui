import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { MiniDisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-disks-overview/mini-disks-overview.component';
import { MiniDriveDetailsComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-details/mini-drive-details.component';
import { MiniDriveStatsComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-stats/mini-drive-stats.component';
import { MiniDriveTemperaturesComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-drive-temperatures/mini-drive-temperatures.component';
import { MiniEnclosureComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-enclosure/mini-enclosure.component';
import { MiniPoolsComponent } from 'app/pages/system/enclosure/components/pages/mini-page/mini-pools/mini-pools.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

@Component({
  selector: 'ix-mini-page',
  templateUrl: './mini-page.component.html',
  styleUrls: ['./mini-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    FakeProgressBarComponent,
    MiniPoolsComponent,
    MiniEnclosureComponent,
    MiniDriveDetailsComponent,
    MiniDriveStatsComponent,
    MiniDisksOverviewComponent,
    MiniDriveTemperaturesComponent,
    TranslateModule,
  ],
})
export class MiniPageComponent {
  private store = inject(EnclosureStore);
  private router = inject(Router);

  readonly enclosureLabel = this.store.enclosureLabel;
  readonly selectedSlot = this.store.selectedSlot;
  readonly isLoading = this.store.isLoading;

  readonly slots = computed(() => {
    const enclosure = this.store.selectedEnclosure();
    if (!enclosure) {
      return [];
    }

    return getSlotsOfSide(enclosure, EnclosureSide.Front);
  });

  protected readonly redirectOnNonMinis = effect(() => {
    const enclosure = this.store.selectedEnclosure();
    if (!enclosure) {
      return;
    }

    if (hasMiniSpecificPage(enclosure)) {
      return;
    }

    this.router.navigate(['/system', 'viewenclosure', enclosure.id]);
  });
}
