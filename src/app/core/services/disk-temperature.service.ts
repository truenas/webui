import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

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
  protected disks: any[] = [];
  protected broadcast;
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

  protected onAuthenticated(evt: CoreEvent) {
    this.authenticated = true;

    const queryOptions = { select: ['name', 'type'] };
    this.websocket.call('disk.query', [[], queryOptions]).subscribe((res) => {
      this.disks = res;
      if (this.subscribers > 0) this.start();
    });

    this.core.register({
      observerClass: this,
      eventName: 'DisksChanged',
    }).subscribe((evt: CoreEvent) => {
      this.stop();
      this.websocket.call('disk.query', [[], queryOptions]).subscribe((res) => {
        this.disks = res;
        if (this.subscribers > 0) this.start();
      });
    });
  }

  start() {
    let tally = 0;
    this.broadcast = setInterval(() => {
      this.fetch(this.disks.map((v) => v.name));
      tally++;
    }, 5 * 60 * 1000);
  }

  stop() {
    clearInterval(this.broadcast);
    delete this.broadcast;
  }

  fetch(disks: string[]) {
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
