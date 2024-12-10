import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { MatCard, MatCardHeader, MatCardContent } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';
import { DiskDetailsOverviewComponent } from './disk-details-overview/disk-details-overview.component';
import { DisksOverviewComponent } from './disks-overview/disks-overview.component';
import { EnclosureSelectorComponent } from './enclosure-selector/enclosure-selector.component';
import { PoolsViewComponent } from './pools-view/pools-view.component';
import { SasExpanderStatusViewComponent } from './sas-expander-status-view/sas-expander-status-view.component';
import { StatusViewComponent } from './status-view/status-view.component';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-page',
  templateUrl: './enclosure-page.component.html',
  styleUrls: ['./enclosure-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    EnclosureHeaderComponent,
    MatCardContent,
    FakeProgressBarComponent,
    PoolsViewComponent,
    StatusViewComponent,
    SasExpanderStatusViewComponent,
    DiskDetailsOverviewComponent,
    DisksOverviewComponent,
    EnclosureSelectorComponent,
  ],
})
export class EnclosurePageComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly enclosures = this.store.enclosures;
  readonly selectedView = this.store.selectedView;
  readonly selectedSlot = this.store.selectedSlot;
  readonly isLoading = this.store.isLoading;

  protected readonly EnclosureView = EnclosureView;

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  protected readonly redirectOnMinis = effect(() => {
    const enclosure = this.store.selectedEnclosure();
    if (!enclosure) {
      return;
    }

    if (!hasMiniSpecificPage(enclosure)) {
      return;
    }

    this.router.navigate(['/system', 'viewenclosure', enclosure.id, 'mini']);
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
    private router: Router,
  ) {}
}
