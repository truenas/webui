import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { TemperatureUnit } from 'app/enums/temperature.enum';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { getAllDiskNames } from 'app/pages/storage/modules/disks/utils/disks.utils';
import { WebSocketService } from 'app/services';

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
  @Input() loading = true;
  @Input() diskDictionary: { [key: string]: Disk } = {};

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

  get allDiskNames(): string[] {
    return getAllDiskNames(this.poolState);
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (this.loading) {
      return;
    }

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
    this.ws.call('disk.temperature_alerts', [Object.keys(this.diskDictionary)]).pipe(untilDestroyed(this)).subscribe((alerts) => {
      this.diskState.alerts = alerts.length;
      this.cdr.markForCheck();
    });
  }

  private loadSmartTasks(): void {
    const disks = Object.keys(this.diskDictionary);
    this.ws.call('smart.test.results', [[['disk', 'in', disks]]]).pipe(untilDestroyed(this)).subscribe((testResults) => {
      testResults.forEach((testResult) => {
        const tests = testResult?.tests ?? [];
        const results = tests.filter((test) => test.status !== SmartTestResultStatus.Running);
        this.diskState.smartTests = this.diskState.smartTests + results.length;
      });
      this.cdr.markForCheck();
    });
  }

  private loadTemperatures(): void {
    this.ws.call('disk.temperature_agg', [Object.keys(this.diskDictionary), 14]).pipe(untilDestroyed(this)).subscribe((res) => {
      const temperatures = Object.values(res);

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
    });
  }
}
