import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, inject, input, OnInit,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { poolLowCapacityPercent } from 'app/constants/pool-capacity.constant';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent, GaugeSegment } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { usageCardElements } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.elements';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';


@Component({
  selector: 'ix-pool-usage-card',
  templateUrl: './pool-usage-card.component.html',
  styleUrls: ['./pool-usage-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatCardHeader,
    MatCardTitle,
    PoolCardIconComponent,
    MatAnchor,
    TestDirective,
    RouterLink,
    MatCardContent,
    GaugeChartComponent,
    TranslateModule,
    FileSizePipe,
    PercentPipe,
  ],
})
export class PoolUsageCardComponent implements OnInit {
  themeService = inject(ThemeService);
  private translate = inject(TranslateService);
  private tierService = inject(SharingTierService);

  readonly poolState = input.required<Pool>();

  protected readonly tierEnabled = this.tierService.tierEnabled;
  protected readonly reservePct = this.tierService.metadataReservePct;

  chartLowCapacityColor: string;
  chartFillColor: string;
  chartBlankColor: string;

  protected readonly searchableElements = usageCardElements;

  ngOnInit(): void {
    this.chartBlankColor = this.themeService.currentTheme().bg1;
    this.chartFillColor = this.themeService.currentTheme().primary;
    this.chartLowCapacityColor = this.themeService.currentTheme().red;
  }

  protected isLowCapacity = computed(() => {
    return this.usedPercentage() >= poolLowCapacityPercent;
  });

  protected disks = computed(() => {
    return getPoolDisks(this.poolState());
  });

  protected used = computed(() => {
    return this.regularUsed() + this.performanceUsed();
  });

  protected available = computed(() => {
    return this.regularAvailable() + this.performanceAvailable();
  });

  protected capacity = computed(() => {
    // Usable Capacity excludes the metadata reserve: available() already has the
    // reserve subtracted, and used() + available() is the space usable for data.
    return this.used() + this.available();
  });

  protected usedPercentage = computed(() => {
    const cap = this.capacity();
    const used = this.used();
    return cap ? (used / cap) * 100 : 0;
  });

  protected iconType = computed(() => {
    if (this.isLowCapacity()) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  });

  protected iconTooltip = computed(() => {
    if (this.isLowCapacity()) {
      return this.translate.instant('Pool is using more than {maxPct}% of available space', { maxPct: poolLowCapacityPercent });
    }
    return this.translate.instant('Everything is fine');
  });

  protected hasSpecialVdev = computed(() => {
    return this.poolState().topology?.special?.length > 0;
  });

  protected showTierBreakdown = computed(() => {
    return this.tierEnabled() && this.hasSpecialVdev();
  });

  protected chartSegments = computed<GaugeSegment[] | undefined>(() => {
    if (!this.showTierBreakdown()) {
      return undefined;
    }
    const cap = this.capacity();
    if (!cap) {
      return undefined;
    }
    // Clamp so rounding / data skew can't push segments past 100%, which would
    // distort the gauge's rounded-doughnut math (gapValue assumes total = 100).
    const performancePct = Math.min(100, Math.max(0, (this.performanceUsed() / cap) * 100));
    const regularPct = Math.min(100 - performancePct, Math.max(0, (this.regularUsed() / cap) * 100));
    return [
      { value: performancePct, color: 'var(--green)' },
      { value: regularPct, color: 'var(--primary)' },
    ];
  });

  protected performanceUsed = computed(() => {
    return this.poolState().special_class_used || 0;
  });

  // Raw special-vdev free space from ZFS, before the metadata reserve is carved out.
  private rawPerformanceAvailable = computed(() => {
    return this.poolState().special_class_available || 0;
  });

  protected performanceUsable = computed(() => {
    // Fall back to used + raw available only when usable is genuinely absent;
    // ?? keeps a legitimate 0 (empty special vdev) from triggering the fallback.
    return this.poolState().special_class_usable ?? (this.performanceUsed() + this.rawPerformanceAvailable());
  });

  // Reserve set aside for metadata once usage crosses the threshold; derived from
  // zfs.tier.config (special_class_metadata_reserve_pct), so it only applies when tiering is on.
  protected performanceReserved = computed(() => {
    if (!this.tierEnabled()) {
      return 0;
    }
    return Math.max(0, (this.performanceUsable() * this.reservePct()) / 100);
  });

  protected performanceAvailable = computed(() => {
    return Math.max(0, this.rawPerformanceAvailable() - this.performanceReserved());
  });

  protected regularUsed = computed(() => {
    return this.poolState().used ?? 0;
  });

  protected regularAvailable = computed(() => {
    return this.poolState().available ?? 0;
  });

  protected tierBreakdown = computed(() => {
    // Performance widths are relative to usable capacity so the reserve occupies
    // a fixed rightmost zone (reservedPercent) that the used bar overlays as it
    // grows past the threshold. Used is clamped so it can't overflow the bar.
    const performanceUsable = this.performanceUsable();
    const regularTotal = this.regularUsed() + this.regularAvailable();
    const pct = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);

    // Widths are relative to usable so the reserve is a fixed-width striped zone
    // pinned to the right. The Used bar runs the full usedPercent and slides
    // under that zone, so green showing through the stripes is usage that has
    // eaten into the reserve. Available is clamped to the space left after Used
    // so data skew (used + available > usable) can't push it past the reserve.
    const usedPercent = Math.min(100, pct(this.performanceUsed(), performanceUsable));
    return {
      performance: {
        hasData: performanceUsable > 0,
        usedPercent,
        availablePercent: Math.min(pct(this.performanceAvailable(), performanceUsable), 100 - usedPercent),
        reservedPercent: Math.min(100, pct(this.performanceReserved(), performanceUsable)),
      },
      regular: {
        hasData: regularTotal > 0,
        usedPercent: pct(this.regularUsed(), regularTotal),
        availablePercent: pct(this.regularAvailable(), regularTotal),
      },
    };
  });
}
