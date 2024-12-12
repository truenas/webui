import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { getSlotsOfSide } from 'app/pages/system/enclosure/utils/get-slots-of-side.utils';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { MiniDisksOverviewComponent } from './mini-disks-overview/mini-disks-overview.component';
import { MiniDriveDetailsComponent } from './mini-drive-details/mini-drive-details.component';
import { MiniDriveStatsComponent } from './mini-drive-stats/mini-drive-stats.component';
import { MiniDriveTemperaturesComponent } from './mini-drive-temperatures/mini-drive-temperatures.component';
import { MiniEnclosureComponent } from './mini-enclosure/mini-enclosure.component';
import { MiniPoolsComponent } from './mini-pools/mini-pools.component';

@Component({
  selector: 'ix-mini-page',
  templateUrl: './mini-page.component.html',
  styleUrls: ['./mini-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardContent,
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
