import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges, OnInit, OnDestroy,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { CoreEvent } from 'app/interfaces/events';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { Temperature } from 'app/services/disk-temperature.service';

interface DiskState {
  health: DiskHealthLevel;
  highestTemperature: number;
  lowestTemperature: number;
  averageTemperature: number;
  alters: number;
  smartTests: number;
  unit: string;
  symbolText: string;
}

export enum DiskHealthLevel {
  Warn = 'warn',
  Error = 'error',
  Safe = 'safe',
}

export enum TemperatureUnit {
  Celsius = 'C',
  Fahrenheit = 'F',
  Kelvin = 'K',
}

@UntilDestroy()
@Component({
  selector: 'ix-disk-health-card',
  templateUrl: './disk-health-card.component.html',
  styleUrls: ['./disk-health-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskHealthCardComponent implements OnInit, OnChanges, OnDestroy {
  @Input() poolState: Pool;
  @Input() loading = true;
  @Input() diskDictionary: { [key: string]: Disk } = {};

  private alterts: Alert[];
  private broadcast: Interval;
  private subscribers = 0;

  readonly diskHealthLevel = DiskHealthLevel;

  isStarting = true;
  diskState: DiskState = {
    health: DiskHealthLevel.Safe,
    highestTemperature: 0,
    lowestTemperature: 0,
    averageTemperature: 0,
    alters: 0,
    smartTests: 0,
    unit: '',
    symbolText: '',
  };

  constructor(
    private ws: WebSocketService,
    private core: CoreService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (!this.loading) {
      this.checkVolumeHealth(this.poolState);
      this.loadAlerts();
      this.loadSmartTasks();
      this.loadTemperatures();
    }
  }

  ngOnChanges(): void {
    this.ngOnInit();
  }

  ngOnDestroy(): void {
    this.stop();
    this.core.emit({ name: 'DiskTemperaturesUnsubscribe', sender: this });
    this.core.unregister({ observerClass: this });
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
    this.ws.call('alert.list').pipe(untilDestroyed(this)).subscribe((res) => {
      this.alterts = res;
    });
  }

  private loadSmartTasks(): void {
    Object.keys(this.diskDictionary).forEach((disk) => {
      this.ws.call('smart.test.results', [[['disk', '=', disk]]]).pipe(untilDestroyed(this)).subscribe((testResults) => {
        testResults.forEach((testResult) => {
          const tests = testResult?.tests ?? [];
          const results = tests.filter((test) => test.status !== SmartTestResultStatus.Running);
          this.diskState.smartTests = this.diskState.smartTests + results.length;
        });
        this.cdr.markForCheck();
      });
    });
  }

  private loadTemperatures(): void {
    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesSubscribe' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.subscribers++;
      if (!this.broadcast) {
        this.start();
      }
    });

    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesUnsubscribe' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.subscribers--;
      if (this.subscribers === 0) {
        this.stop();
      }
    });

    this.core.register({ observerClass: this, eventName: 'DiskTemperatures' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const temperatures: number[] = Object.values(evt.data.values);
      this.diskState.highestTemperature = Math.max(...temperatures);
      this.diskState.lowestTemperature = Math.min(...temperatures);
      this.diskState.averageTemperature = temperatures.reduce((a, b) => a + b, 0) / temperatures.length;
      this.diskState.unit = evt.data.unit;
      this.diskState.symbolText = evt.data.symbolText;
      this.isStarting = false;
      this.cdr.markForCheck();
    });

    this.core.emit({ name: 'DiskTemperaturesSubscribe', sender: this });
  }

  private start(): void {
    this.broadcast = setInterval(() => {
      this.fetch();
    }, 2000);
  }

  private stop(): void {
    clearInterval(this.broadcast);
    delete this.broadcast;
  }

  private fetch(): void {
    this.ws.call('disk.temperatures', [Object.keys(this.diskDictionary)]).pipe(untilDestroyed(this)).subscribe((res) => {
      const data: Temperature = {
        keys: Object.keys(res),
        values: res,
        unit: TemperatureUnit.Celsius,
        symbolText: '°',
      };
      this.core.emit({ name: 'DiskTemperatures', data, sender: this });
    });
  }
}
