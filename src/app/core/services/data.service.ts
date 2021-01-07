import { Injectable, OnDestroy } from '@angular/core';
import { BaseService } from './base.service';
import { CoreService, CoreEvent } from './core.service';
import { ApiCall } from './api.service';
import { WebSocketService } from 'app/services/ws.service';
import { SystemProfileService } from './system-profile.service';
import { DiskTemperatureService } from './disk-temperature.service';
import { DiskStateService } from './disk-state.service';
import { StatsService } from './stats.service';

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
  providedIn: 'root'
})
export class DataService implements OnDestroy {

  constructor(
    private sysInfo: SystemProfileService,
    private dts: DiskTemperatureService,
    private dss: DiskStateService,
    private statsService: StatsService,
    protected core: CoreService,
    protected ws: WebSocketService
  ) {
    this.core.register({ observerClass: this, eventName: "MultiCall"}).subscribe((evt: CoreEvent) => {
      this.fetch(evt.data);
    });
  }

  fetch(job: MultiCall){
    let results = [];
    let tally = 0;
    job.queue.forEach((call: ApiCall, index) => {
      this.ws.call(call.namespace, call.args).subscribe((res) => {
        results[index] = res; // Ensure proper order
        tally++
        if(tally == job.queue.length){
          this.core.emit({name: job.responseEvent, data: { calls: job.queue, responses: results}, sender: this });
        }
      });
    });
  }

  ngOnDestroy(){
    this.core.unregister({observerClass: this});
  }

}
