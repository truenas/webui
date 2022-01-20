import { Injectable, OnDestroy } from '@angular/core';
import { CoreEvent } from 'app/interfaces/events';
import { ApiCall } from 'app/services/api.service';
import { CoreService } from 'app/services/core-service/core.service';
import { DiskStateService } from 'app/services/disk-state/disk-state.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { SystemProfileService } from 'app/services/system-profile.service';
import { WebSocketService } from 'app/services/ws.service';

/*
 * This is a collection of services that will
 * make calls when UI initializes and cache it
 * for later use
 * */

export interface MultiCall {
  responseEvent: string;
  queue: ApiCall[];
}

@Injectable({
  providedIn: 'root',
})
export class DataService implements OnDestroy {
  constructor(
    // TODO: Do not remove. Removing will stop SysInfo from being emitted.
    private sysInfo: SystemProfileService,
    private dts: DiskTemperatureService,
    private dss: DiskStateService,
    protected core: CoreService,
    protected ws: WebSocketService,
  ) {
    this.core.register({ observerClass: this, eventName: 'MultiCall' }).subscribe((evt: CoreEvent) => {
      this.fetch(evt.data);
    });
  }

  fetch(job: MultiCall): void {
    const results: any[] = [];
    let tally = 0;
    job.queue.forEach((call: ApiCall, index) => {
      this.ws.call(call.namespace, call.args).subscribe((res) => {
        results[index] = res; // Ensure proper order
        tally++;
        if (tally == job.queue.length) {
          this.core.emit({ name: job.responseEvent, data: { calls: job.queue, responses: results }, sender: this });
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }
}
