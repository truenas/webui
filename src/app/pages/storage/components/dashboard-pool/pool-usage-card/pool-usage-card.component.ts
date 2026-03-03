import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input, OnInit, signal, inject,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent, GaugeSegment } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { usageCardElements } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.elements';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';

const maxPct = 80;

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
  readonly rootDataset = input.required<Dataset>();

  protected tierEnabled = signal(false);

  chartLowCapacityColor: string;
  chartFillColor: string;
  chartBlankColor: string;

  protected readonly searchableElements = usageCardElements;

  ngOnInit(): void {
    this.chartBlankColor = this.themeService.currentTheme().bg1;
    this.chartFillColor = this.themeService.currentTheme().primary;
    this.chartLowCapacityColor = this.themeService.currentTheme().red;

    this.tierService.getTierConfig().subscribe((config) => {
      this.tierEnabled.set(config.enabled);
    });
  }

  protected isLowCapacity = computed(() => {
    return this.usedPercentage() >= maxPct;
  });

  protected disks = computed(() => {
    return getPoolDisks(this.poolState());
  });

  protected capacity = computed(() => {
    return this.used() + this.available();
  });

  protected used = computed(() => {
    return this.poolState().used;
  });

  protected available = computed(() => {
    return this.poolState().available;
  });

  protected usedPercentage = computed(() => {
    return (this.used() / this.capacity()) * 100;
  });

  protected iconType = computed(() => {
    if (this.isLowCapacity()) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  });

  protected iconTooltip = computed(() => {
    if (this.isLowCapacity()) {
      return this.translate.instant('Pool is using more than {maxPct}% of available space', { maxPct });
    }
    return this.translate.instant('Everything is fine');
  });

  protected hasSpecialVdev = computed(() => {
    return this.poolState().topology?.special?.length > 0;
  });

  protected showTierBreakdown = computed(() => {
    return this.tierEnabled() && this.hasSpecialVdev();
  });

  protected chartSegments = computed<GaugeSegment[]>(() => {
    if (!this.showTierBreakdown()) {
      return undefined;
    }
    const cap = this.capacity();
    if (!cap) {
      return undefined;
    }
    return [
      { value: (this.performanceUsed() / cap) * 100, color: 'var(--green)' },
      { value: (this.regularUsed() / cap) * 100, color: 'var(--primary)' },
    ];
  });

  protected performanceUsed = computed(() => {
    return this.poolState().special_class_used || 0;
  });

  protected performanceAvailable = computed(() => {
    return this.poolState().special_class_available || 0;
  });

  protected performanceReserved = computed(() => {
    return this.poolState().special_class_reserved || 0;
  });

  protected performanceTotal = computed(() => {
    return this.performanceUsed() + this.performanceAvailable() + this.performanceReserved();
  });

  protected performanceUsedPercent = computed(() => {
    const total = this.performanceTotal();
    return total > 0 ? (this.performanceUsed() / total) * 100 : 0;
  });

  protected performanceAvailablePercent = computed(() => {
    const total = this.performanceTotal();
    return total > 0 ? (this.performanceAvailable() / total) * 100 : 0;
  });

  protected performanceReservedPercent = computed(() => {
    const total = this.performanceTotal();
    return total > 0 ? (this.performanceReserved() / total) * 100 : 0;
  });

  protected regularUsed = computed(() => {
    return this.used() - this.performanceUsed();
  });

  protected regularAvailable = computed(() => {
    return this.available() - this.performanceAvailable();
  });

  protected regularTotal = computed(() => {
    return this.regularUsed() + this.regularAvailable();
  });

  protected regularUsedPercent = computed(() => {
    const total = this.regularTotal();
    return total > 0 ? (this.regularUsed() / total) * 100 : 0;
  });

  protected regularAvailablePercent = computed(() => {
    const total = this.regularTotal();
    return total > 0 ? (this.regularAvailable() / total) * 100 : 0;
  });
}
