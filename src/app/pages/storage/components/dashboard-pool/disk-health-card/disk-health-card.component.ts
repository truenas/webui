import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TemperatureUnit } from 'app/enums/temperature.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk, TemperatureAgg } from 'app/interfaces/storage.interface';
import { DialogService, WebSocketService } from 'app/services';

interface DiskState {
  health: DiskHealthLevel;
  highestTemperature: number;
  lowestTemperature: number;
  averageTemperature: number;
  alerts: number;
  smartTests: number;
  unit: string;
  symbolText: string;
}

export enum DiskHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
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
  @Input() disks: StorageDashboardDisk[];

  readonly diskHealthLevel = DiskHealthLevel;

  diskState: DiskState = {
    health: DiskHealthLevel.Safe,
    highestTemperature: null,
    lowestTemperature: null,
    averageTemperature: null,
    alerts: 0,
    smartTests: 0,
    unit: '',
    symbolText: '',
  };

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.checkVolumeHealth(this.poolState);
    this.loadAlerts();
    this.loadSmartTasks();
    this.loadTemperatures();
  }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  private checkVolumeHealth(poolState: Pool): void {
    const isError = this.isStatusError(poolState);
    const isWarning = this.isStatusWarning(poolState);

    if (isError) {
      this.diskState.health = DiskHealthLevel.Error;
    } else if (isWarning || !poolState.healthy) {
      this.diskState.health = DiskHealthLevel.Warn;
    } else {
      this.diskState.health = DiskHealthLevel.Safe;
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

  private loadAlerts(): void {
    this.diskState.alerts = this.disks.reduce((total, current) => total + current.alerts.length, 0);
    this.cdr.markForCheck();
  }

  private loadSmartTasks(): void {
    for (const disk of this.disks) {
      this.diskState.smartTests += disk.smartTests;
    }
    this.cdr.markForCheck();
  }

  private loadTemperatures(): void {
    const tempAggs: { [disk: string]: TemperatureAgg } = {};
    for (const disk of this.disks) {
      if (disk.tempAggregates) {
        tempAggs[disk.devname] = disk.tempAggregates;
      }
    }
    const temperatures = Object.values(tempAggs);

    const maxValues = temperatures.map((temperature) => temperature.max).filter((value) => value);
    const minValues = temperatures.map((temperature) => temperature.min).filter((value) => value);
    const avgValues = temperatures.map((temperature) => temperature.avg).filter((value) => value);
    const avgSum = avgValues.reduce((a, b) => a + b, 0);

    this.diskState.highestTemperature = maxValues.length > 0 ? Math.max(...maxValues) : null;
    this.diskState.lowestTemperature = minValues.length > 0 ? Math.min(...minValues) : null;
    this.diskState.averageTemperature = avgValues.length > 0 ? avgSum / avgValues.length : null;
    this.diskState.unit = TemperatureUnit.Celsius;
    this.diskState.symbolText = '°';
    this.cdr.markForCheck();
  }
}
