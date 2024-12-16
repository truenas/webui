import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component, computed, input, OnInit,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import { usageCardElements } from 'app/pages/storage/components/dashboard-pool/pool-usage-card/pool-usage-card.elements';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';
import { ThemeService } from 'app/services/theme/theme.service';

const maxPct = 80;

@UntilDestroy()
@Component({
  selector: 'ix-pool-usage-card',
  templateUrl: './pool-usage-card.component.html',
  styleUrls: ['./pool-usage-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  readonly poolState = input<Pool>();
  readonly rootDataset = input<Dataset>();

  chartLowCapacityColor: string;
  chartFillColor: string;
  chartBlankColor: string;

  protected readonly searchableElements = usageCardElements;

  constructor(
    public themeService: ThemeService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.chartBlankColor = this.themeService.currentTheme().bg1;
    this.chartFillColor = this.themeService.currentTheme().primary;
    this.chartLowCapacityColor = this.themeService.currentTheme().red;
  }

  protected isLowCapacity = computed(() => {
    return this.usedPercentage() >= maxPct;
  });

  protected disks = computed(() => {
    return getPoolDisks(this.poolState());
  });

  protected capacity = computed(() => {
    return this.rootDataset().available.parsed + this.rootDataset().used.parsed;
  });

  protected usedPercentage = computed(() => {
    return this.rootDataset().used.parsed / this.capacity() * 100;
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
}
