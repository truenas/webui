import {
  ChangeDetectionStrategy,
  Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';
import { ThemeService } from 'app/services/theme/theme.service';

const maxPct = 80;

@UntilDestroy()
@Component({
  selector: 'ix-pool-usage-card',
  templateUrl: './pool-usage-card.component.html',
  styleUrls: ['./pool-usage-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolUsageCardComponent implements OnInit {
  @Input() poolState: Pool;
  @Input() rootDataset: Dataset;

  chartLowCapacityColor: string;
  chartFillColor: string;
  chartBlankColor: string;

  constructor(
    public themeService: ThemeService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.chartBlankColor = this.themeService.currentTheme().bg1;
    this.chartFillColor = this.themeService.currentTheme().primary;
    this.chartLowCapacityColor = this.themeService.currentTheme().red;
  }

  get isLowCapacity(): boolean {
    return this.usedPercentage >= maxPct;
  }

  get disks(): string[] {
    return getPoolDisks(this.poolState);
  }

  get capacity(): number {
    return this.rootDataset.available.parsed + this.rootDataset.used.parsed;
  }

  get usedPercentage(): number {
    return this.rootDataset.used.parsed / this.capacity * 100;
  }

  get iconType(): PoolCardIconType {
    if (this.isLowCapacity) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  }

  get iconTooltip(): string {
    if (this.isLowCapacity) {
      return this.translate.instant('Pool is using more than {maxPct}% of available space', { maxPct });
    }
    return this.translate.instant('Everything is fine');
  }
}
