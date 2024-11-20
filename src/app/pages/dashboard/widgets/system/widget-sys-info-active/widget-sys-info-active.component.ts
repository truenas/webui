import { TitleCasePipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter, map } from 'rxjs';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJobForActiveNode } from 'app/modules/jobs/store/job.selectors';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { ProductImageComponent } from 'app/pages/dashboard/widgets/system/common/product-image/product-image.component';
import { UptimePipe } from 'app/pages/dashboard/widgets/system/common/uptime.pipe';
import { getSystemVersion } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { LocaleService } from 'app/services/locale.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectHasEnclosureSupport, selectIsEnterprise, selectIsIxHardware,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-sys-info-active',
  templateUrl: './widget-sys-info-active.component.html',
  styleUrls: ['../common/widget-sys-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    IxIconComponent,
    ProductImageComponent,
    MatButton,
    TestDirective,
    RouterLink,
    MatIconButton,
    MatTooltip,
    MatList,
    MatListItem,
    NgxSkeletonLoaderModule,
    CopyButtonComponent,
    TranslateModule,
    UptimePipe,
    TitleCasePipe,
  ],
})
export class WidgetSysInfoActiveComponent {
  size = input.required<SlotSize>();

  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  hasEnclosureSupport = toSignal(this.store$.select(selectHasEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForActiveNode));

  updateAvailable = toSignal(this.resources.updateAvailable$);
  systemInfo = toSignal(this.resources.systemInfo$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value),
  ));

  startTime = Date.now();

  realElapsedSeconds = toSignal(this.resources.refreshInterval$.pipe(
    map(() => {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }),
  ));

  version = computed(() => getSystemVersion(this.systemInfo().version, this.systemInfo().codename));
  uptime = computed(() => this.systemInfo().uptime_seconds + this.realElapsedSeconds());
  datetime = computed(() => {
    this.realElapsedSeconds();
    const [, timeValue] = this.localeService.getDateAndTime();
    return `${timeValue.split(':')[0]}:${timeValue.split(':')[1]}`;
  });

  isLoaded = computed(() => this.systemInfo());

  constructor(
    private resources: WidgetResourcesService,
    private store$: Store<AppState>,
    private localeService: LocaleService,
  ) {
    this.resources.refreshSystemInfo();
  }

  isFirstRender = true;

  // eslint-disable-next-line sonarjs/no-invariant-returns
  rendered(): string {
    if (!this.isFirstRender) {
      return '';
    }

    this.isFirstRender = false;
    performance.mark('Dashboard End');
    performance.measure('Dashboard Init', 'Dashboard Start', 'Dashboard End');
    return '';
  }

  protected readonly iconMarker = iconMarker;
}
