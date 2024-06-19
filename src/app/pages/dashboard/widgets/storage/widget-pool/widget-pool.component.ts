import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { filter, switchMap, tap } from 'rxjs';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyWarning, VdevType } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetComponent } from 'app/pages/dashboard/types/widget-component.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetPoolSettings, poolWidget } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { StorageService } from 'app/services/storage.service';
import { ThemeService } from 'app/services/theme/theme.service';

const maxPct = 80;

@Component({
  selector: 'ix-widget-pool',
  templateUrl: './widget-pool.component.html',
  styleUrls: ['./widget-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetPoolComponent implements WidgetComponent, OnInit {
  size = input.required<SlotSize>();
  settings = input.required<WidgetPoolSettings>();
  poolExists = true;

  protected chartLowCapacityColor: string;
  protected chartFillColor: string;
  protected chartBlankColor: string;

  protected poolId = computed(() => this.settings()?.poolId || '');

  protected pool = toSignal(toObservable(this.poolId).pipe(
    filter(Boolean),
    switchMap((poolId) => this.resources.getPoolById(+poolId)),
    tap((pool) => {
      this.poolExists = !!pool;
      this.cdr.markForCheck();
    }),
  ));

  protected rootDataset = toSignal(toObservable(this.pool).pipe(
    filter(Boolean),
    switchMap((pool) => this.resources.getDatasetById(pool.name)),
  ));

  protected disks = toSignal(toObservable(this.pool).pipe(
    filter(Boolean),
    switchMap((pool) => this.resources.getDisksByPoolId(pool.name)),
  ));

  protected isPoolLoading = computed(() => !this.pool());
  protected isDatasetLoading = computed(() => !this.rootDataset());
  protected isDisksLoading = computed(() => !this.disks());

  protected isLowCapacity = computed(() => {
    return this.usedPercentage() >= maxPct;
  });

  protected capacity = computed(() => {
    return this.rootDataset().available.parsed + this.rootDataset().used.parsed;
  });

  protected usedPercentage = computed(() => {
    return this.rootDataset().used.parsed / this.capacity() * 100;
  });

  protected dataTopology = computed(() => {
    if (this.pool()?.status === PoolStatus.Offline) {
      return this.translate.instant('Offline VDEVs');
    }

    return this.parseTopologyData();
  });

  protected totalZfsErrors = computed(() => {
    if (!this.pool()?.topology) {
      return 0;
    }
    return Object.values(this.pool().topology).reduce((totalErrors, vdevs) => {
      return totalErrors + vdevs.reduce((vdevCategoryErrors, vdev) => {
        return vdevCategoryErrors
          + (vdev.stats?.read_errors || 0)
          + (vdev.stats?.write_errors || 0)
          + (vdev.stats?.checksum_errors || 0);
      }, 0);
    }, 0);
  });

  protected scanDuration = computed(() => {
    const scan = this.pool().scan;
    if (!scan?.end_time?.$date || !scan?.start_time?.$date) {
      return '';
    }

    const seconds = secondsToDuration((scan.end_time.$date - scan.start_time.$date) / 1000);
    return formatDuration(seconds);
  });

  readonly name = poolWidget.name;

  constructor(
    private themeService: ThemeService,
    private resources: WidgetResourcesService,
    private translate: TranslateService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
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
      : disks?.find((disk) => disk.name === (vdevs[0])?.disk)?.size;

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
