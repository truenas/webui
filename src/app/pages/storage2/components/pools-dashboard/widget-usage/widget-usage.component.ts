import {
  Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumeData } from 'app/interfaces/volume-data.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';

interface UsageState {
  capacity: string;
  used: string;
  avail: string;
  snapshots: string;
  usedPct: number;
  health: UsageHealthLevel;
}

export enum UsageHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
}

const unknownSize = 'Unknown';
const maxPct = 80;

@UntilDestroy()
@Component({
  selector: 'ix-widget-usage',
  templateUrl: './widget-usage.component.html',
  styleUrls: ['./widget-usage.component.scss'],
})
export class WidgetUsageComponent extends WidgetComponent implements OnInit, OnChanges {
  @Input() poolState: Pool;
  @Input() volumeData: VolumeData;
  @Input() loading = true;
  private utils: WidgetUtils;
  readonly usageHealthLevel = UsageHealthLevel;

  usageState: UsageState = {
    avail: unknownSize,
    capacity: unknownSize,
    used: unknownSize,
    usedPct: 0,
    snapshots: unknownSize,
    health: UsageHealthLevel.Safe,
  };

  get isLowCapacity(): boolean {
    return this.usageState.usedPct >= maxPct;
  }

  constructor(
    public router: Router,
    public translate: TranslateService,
  ) {
    super(translate);
    this.utils = new WidgetUtils();
  }

  ngOnInit(): void {
    if (!this.loading) {
      this.parseVolumeData(this.volumeData);
      this.checkVolumeHealth(this.poolState);
    }
  }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  private parseVolumeData(volumeData: VolumeData): void {
    if (volumeData && typeof volumeData.avail !== undefined) {
      const avail = this.utils.convert(volumeData.avail);
      this.usageState.avail = `${avail.value} ${avail.units}`;
    } else {
      this.usageState.avail = unknownSize;
    }

    if (volumeData && typeof volumeData.used !== undefined) {
      const used = this.utils.convert(volumeData.used);
      this.usageState.used = `${used.value} ${used.units}`;
    } else {
      this.usageState.used = unknownSize;
    }

    if (volumeData && typeof volumeData.avail !== undefined && typeof volumeData.used !== undefined) {
      const capacity = this.utils.convert(volumeData.avail + volumeData.used);
      this.usageState.capacity = `${capacity.value} ${capacity.units}`;
    } else {
      this.usageState.capacity = unknownSize;
    }

    if (volumeData && typeof volumeData.used_pct !== undefined) {
      this.usageState.usedPct = this.percentAsNumber(volumeData.used_pct);
    }
  }

  private checkVolumeHealth(poolState: Pool): void {
    const isError = this.isStatusError(poolState);
    const isWarning = this.isStatusWarning(poolState);

    if (isError) {
      this.usageState.health = UsageHealthLevel.Error;
    } else if (isWarning || !poolState.healthy || this.isLowCapacity) {
      this.usageState.health = UsageHealthLevel.Warn;
    } else {
      this.usageState.health = UsageHealthLevel.Safe;
    }
  }

  private isStatusError(poolState: Pool): boolean {
    return [
      PoolStatus.Faulted,
      PoolStatus.Unavailable,
      PoolStatus.Removed,
    ].includes(poolState.status);
  }

  private isStatusWarning(poolState: Pool): boolean {
    return [
      PoolStatus.Locked,
      PoolStatus.Unknown,
      PoolStatus.Offline,
      PoolStatus.Degraded,
    ].includes(poolState.status);
  }

  private percentAsNumber(value: string): number {
    const spl = value.split('%');
    return parseInt(spl[0]);
  }
}
