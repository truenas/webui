import { Injectable } from '@angular/core';
import { CoreEvent } from 'app/interfaces/events';
import { QueryOptions } from 'app/interfaces/query-api.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { BaseService } from './base.service';

export interface Temperature {
  keys: string[];
  values: any;
  unit: string;
  symbolText: string;
}

@Injectable({
  providedIn: 'root',
})
export class DiskTemperatureService extends BaseService {
  protected disks: Disk[] = [];
  protected broadcast: any;
  protected subscribers = 0;

  constructor() {
    super();

    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesSubscribe' }).subscribe((evt: CoreEvent) => {
      this.subscribers++;
      if (!this.broadcast) {
        this.start();
      }
    });

    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesUnsubscribe' }).subscribe((evt: CoreEvent) => {
      this.subscribers--;
      if (this.subscribers == 0) {
        this.stop();
      }
    });
  }

  protected onAuthenticated(evt: CoreEvent): void {
    this.authenticated = true;

    const queryOptions: QueryOptions<Disk> = { select: ['name', 'type'] };
    this.websocket.call('disk.query', [[], queryOptions]).subscribe((res) => {
      this.disks = res;
      if (this.subscribers > 0) this.start();
    });

    this.core.register({
      observerClass: this,
      eventName: 'DisksChanged',
    }).subscribe(() => {
      this.stop();
      this.websocket.call('disk.query', [[], queryOptions]).subscribe((res) => {
        this.disks = res;
        if (this.subscribers > 0) this.start();
      });
    });
  }

  start(): void {
    let tally = 0;
    this.broadcast = setInterval(() => {
      this.fetch(this.disks.map((v) => v.name));
      tally++;
    }, 2000);
  }

  stop(): void {
    clearInterval(this.broadcast);
    delete this.broadcast;
  }

  fetch(disks: string[]): void {
    this.websocket.call('disk.temperatures', [disks]).subscribe((res) => {
      const data: Temperature = {
        keys: Object.keys(res),
        values: res,
        unit: 'Celsius',
        symbolText: '°',
      };
      this.core.emit({ name: 'DiskTemperatures', data, sender: this });
    });
  }
}
