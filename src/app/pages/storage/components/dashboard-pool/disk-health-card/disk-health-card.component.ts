import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { SmartTestResultPageType } from 'app/enums/smart-test-results-page-type.enum';
import { TemperatureUnit } from 'app/enums/temperature.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { getPoolDisks } from 'app/pages/storage/modules/disks/utils/get-pool-disks.utils';

interface DiskState {
  highestTemperature: number;
  lowestTemperature: number;
  averageTemperature: number;
  alerts: number;
  smartTests: number;
  unit: string;
  symbolText: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-disk-health-card',
  templateUrl: './disk-health-card.component.html',
  styleUrls: ['./disk-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskHealthCardComponent implements OnInit, OnChanges {
  @Input() poolState: Pool;
  @Input() disks: StorageDashboardDisk[] = [];

  SmartTestResultPageType = SmartTestResultPageType;

  get disksNames(): string[] {
    return getPoolDisks(this.poolState);
  }

  diskState: DiskState = {
    highestTemperature: null,
    lowestTemperature: null,
    averageTemperature: null,
    alerts: 0,
    smartTests: 0,
    unit: '',
    symbolText: '',
  };

  constructor(
    public translate: TranslateService,
  ) { }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  ngOnInit(): void {
    if (this.disks) {
      this.diskState.smartTests = this.disks.reduce((total, disk) => total + disk.smartTestsFailed, 0);
      this.diskState.alerts = this.disks.reduce((total, current) => total + current.alerts.length, 0);
      this.loadTemperatures();
    }
  }

  get isAverageTempReady(): boolean {
    return this.diskState.averageTemperature !== null && !Number.isNaN(this.diskState.averageTemperature);
  }

  get isHighestTempReady(): boolean {
    return this.diskState.highestTemperature !== null && !Number.isNaN(this.diskState.highestTemperature);
  }

  get isLowestTempReady(): boolean {
    return this.diskState.lowestTemperature !== null && !Number.isNaN(this.diskState.lowestTemperature);
  }

  get iconType(): PoolCardIconType {
    if (this.diskState.alerts || this.diskState.smartTests) {
      return PoolCardIconType.Warn;
    }
    return PoolCardIconType.Safe;
  }

  get iconTooltip(): string {
    if (this.diskState.alerts || this.diskState.smartTests) {
      return this.translate.instant('Pool Disks have {alerts} alerts and {smartTests} failed S.M.A.R.T. tests', {
        alerts: this.diskState.alerts,
        smartTests: this.diskState.smartTests,
      });
    }
    return this.translate.instant('Everything is fine');
  }

  private loadTemperatures(): void {
    let avgSum = 0;
    let avgCounter = 0;
    this.disks.forEach((disk) => {
      if (!disk.tempAggregates) {
        return;
      }

      if (this.diskState.highestTemperature === null) {
        this.diskState.highestTemperature = disk.tempAggregates.max;
      } else {
        this.diskState.highestTemperature = Math.max(this.diskState.highestTemperature, disk.tempAggregates.max);
      }

      if (this.diskState.lowestTemperature === null) {
        this.diskState.lowestTemperature = disk.tempAggregates.min;
      } else {
        this.diskState.lowestTemperature = Math.min(this.diskState.lowestTemperature, disk.tempAggregates.min);
      }

      avgSum += disk.tempAggregates.avg;
      avgCounter++;
    });

    this.diskState.averageTemperature = avgSum / avgCounter;
    this.diskState.unit = TemperatureUnit.Celsius;
    this.diskState.symbolText = '°';
  }
}
