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
    return this.used() + this.available() + this.performanceReserved();
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

  protected performanceAvailable = computed(() => {
    return this.poolState().special_class_available || 0;
  });

  protected performanceReserved = computed(() => {
    return Math.max(0, this.poolState().special_class_reserved || 0);
  });

  protected regularUsed = computed(() => {
    return this.poolState().used ?? 0;
  });

  protected regularAvailable = computed(() => {
    return this.poolState().available ?? 0;
  });

  protected tierBreakdown = computed(() => {
    const performanceTotal = this.performanceUsed() + this.performanceAvailable() + this.performanceReserved();
    const regularTotal = this.regularUsed() + this.regularAvailable();
    const pct = (value: number, total: number): number => (total > 0 ? (value / total) * 100 : 0);
    return {
      performance: {
        hasData: performanceTotal > 0,
        usedPercent: pct(this.performanceUsed(), performanceTotal),
        availablePercent: pct(this.performanceAvailable(), performanceTotal),
        reservedPercent: pct(this.performanceReserved(), performanceTotal),
      },
      regular: {
        hasData: regularTotal > 0,
        usedPercent: pct(this.regularUsed(), regularTotal),
        availablePercent: pct(this.regularAvailable(), regularTotal),
      },
    };
  });
}
