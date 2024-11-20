import { PercentPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
  OnInit,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter, switchMap } from 'rxjs';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyWarning, VdevType } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { Pool } from 'app/interfaces/pool.interface';
import { GaugeChartComponent } from 'app/modules/charts/gauge-chart/gauge-chart.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { StorageService } from 'app/services/storage.service';
import { ThemeService } from 'app/services/theme/theme.service';

const maxPct = 80;

@Component({
  selector: 'ix-pool-usage-gauge',
  templateUrl: './pool-usage-gauge.component.html',
  styleUrl: './pool-usage-gauge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgxSkeletonLoaderModule,
    GaugeChartComponent,
    TranslateModule,
    FormatDateTimePipe,
    FileSizePipe,
    PercentPipe,
  ],
})
export class PoolUsageGaugeComponent implements OnInit {
  readonly pool = input.required<Pool>();
  readonly size = input<number>(150);

  protected chartLowCapacityColor: string;
  protected chartFillColor: string;
  protected chartBlankColor: string;

  protected isDatasetLoading = computed(() => !this.rootDataset());
  protected isDisksLoading = computed(() => !this.disks());
  protected isPoolLoading = computed(() => !this.pool());

  protected disks = toSignal(toObservable(this.pool).pipe(
    filter(Boolean),
    switchMap((pool) => this.resources.getDisksByPoolId(pool.name)),
  ));

  protected rootDataset = toSignal(toObservable(this.pool).pipe(
    filter(Boolean),
    switchMap((pool) => this.resources.getDatasetById(pool.name)),
  ));

  protected capacity = computed(() => {
    return this.rootDataset().available.parsed + this.rootDataset().used.parsed;
  });

  protected usedPercentage = computed(() => {
    return this.rootDataset().used.parsed / this.capacity() * 100;
  });

  protected isLowCapacity = computed(() => {
    return this.usedPercentage() >= maxPct;
  });

  protected dataTopology = computed(() => {
    if (this.pool()?.status === PoolStatus.Offline) {
      return this.translate.instant('Offline VDEVs');
    }

    return this.parseTopologyData();
  });

  protected scanDuration = computed(() => {
    const scan = this.pool()?.scan;
    if (!scan?.end_time?.$date || !scan?.start_time?.$date) {
      return '';
    }

    const seconds = secondsToDuration((scan.end_time.$date - scan.start_time.$date) / 1000);
    return formatDuration(seconds);
  });

  constructor(
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private storageService: StorageService,
    private themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.chartBlankColor = this.themeService.currentTheme().bg2;
    this.chartFillColor = this.themeService.currentTheme().primary;
    this.chartLowCapacityColor = this.themeService.currentTheme().red;
  }

  private parseTopologyData(): string {
    const vdevs = this.pool()?.topology?.data;
    const disks = this.disks();

    if (!vdevs?.length) {
      return this.translate.instant('VDEVs not assigned');
    }

    // Check VDEV Widths
    let vdevWidth = 0;

    // There should only be one value
    const allVdevWidths = this.storageService.getVdevWidths(vdevs);
    const isMixedWidth = this.storageService.isMixedWidth(allVdevWidths);

    if (!isMixedWidth) {
      vdevWidth = Array.from(allVdevWidths.values())[0];
    }

    const type = vdevs[0]?.type;
    const size = vdevs[0]?.children.length
      ? disks?.find((disk) => disk.name === vdevs[0]?.children[0]?.disk)?.size
      : disks?.find((disk) => disk.name === vdevs[0]?.disk)?.size;

    let outputString = `${vdevs.length} x `;
    if (vdevWidth) {
      outputString += this.translate.instant('{type} | {vdevWidth} wide | ', { type, vdevWidth });
    }

    const warnings = this.storageService.validateVdevs(VdevType.Data, vdevs, disks);
    const isMixedVdevCapacity = warnings.includes(TopologyWarning.MixedVdevCapacity)
      || warnings.includes(TopologyWarning.MixedDiskCapacity);

    if (!isMixedVdevCapacity && size) {
      outputString += buildNormalizedFileSize(size);
    } else if (isMixedVdevCapacity) {
      outputString += this.translate.instant('Mixed Capacity');
    } else {
      outputString += '?';
    }

    return outputString;
  }
}
