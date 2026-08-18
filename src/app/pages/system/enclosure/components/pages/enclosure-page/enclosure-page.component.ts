import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TnCardComponent, TnCardHeaderDirective } from '@truenas/ui-components';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { DiskDetailsOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disk-details-overview.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/disks-overview/disks-overview.component';
import { EnclosureSelectorComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import { PoolsViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/pools-view.component';
import { SasExpanderStatusViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';
import { StatusViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/status-view.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';

@Component({
  selector: 'ix-enclosure-page',
  templateUrl: './enclosure-page.component.html',
  styleUrls: ['./enclosure-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    EnclosureHeaderComponent,
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
  private store = inject(EnclosureStore);
  private translate = inject(TranslateService);
  private router = inject(Router);

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
}
