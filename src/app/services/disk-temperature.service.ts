import { Injectable, OnDestroy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, Subject } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, DiskTemperatures } from 'app/interfaces/storage.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { CoreService } from 'app/services/core-service/core.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { WebSocketService } from 'app/services/ws.service';

export interface Temperature {
  keys: string[];
  values: DiskTemperatures;
  unit: string;
  symbolText: string;
}

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class DiskTemperatureService implements OnDestroy {
  protected disks: { name: string; type: DiskType }[] = [];
  protected broadcast: Interval;
  protected subscribers = 0;

  private disksUpdateSubscriptionId: string;

  constructor(
    protected core: CoreService,
    protected websocket: WebSocketService,
    private disksUpdateService: DisksUpdateService,
  ) { }

  listenForTemperatureUpdates(): void {
    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesSubscribe' }).subscribe(() => {
      this.subscribers++;
      if (!this.broadcast) {
        this.start();
      }
    });

    this.core.register({ observerClass: this, eventName: 'DiskTemperaturesUnsubscribe' }).subscribe(() => {
      this.subscribers--;
      if (this.subscribers === 0) {
        this.stop();
      }
    });

    this.websocket.call('disk.query', [[], { select: ['name', 'type'] }]).subscribe((disks) => {
      this.disks = disks;
      if (this.subscribers > 0) this.start();
    });

    const disksUpdateTrigger$ = new Subject<Disk[]>();
    disksUpdateTrigger$.pipe(
      map((disks) => {
        this.stop();
        return disks.map((disk) => ({ name: disk.name, type: disk.type }));
      }),
      untilDestroyed(this),
    ).subscribe((disks) => {
      this.disks = disks;
      if (this.subscribers > 0) this.start();
    });
    this.disksUpdateSubscriptionId = this.disksUpdateService.addSubscriber(disksUpdateTrigger$, true);
  }

  start(): void {
    this.fetch(this.disks.map((disk) => disk.name));
    this.broadcast = setInterval(() => {
      this.fetch(this.disks.map((disk) => disk.name));
    }, 10000);
  }

  stop(): void {
    clearInterval(this.broadcast);
    delete this.broadcast;
  }

  fetch(disks: string[]): void {
    this.websocket.call('disk.temperatures', [disks]).subscribe((temperatures) => {
      const data: Temperature = {
        keys: Object.keys(temperatures),
        values: temperatures,
        unit: 'Celsius',
        symbolText: '°',
      };
      this.core.emit({ name: 'DiskTemperatures', data, sender: this });
    });
  }

  ngOnDestroy(): void {
    this.disksUpdateService.removeSubscriber(this.disksUpdateSubscriptionId);
  }
}
