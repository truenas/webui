import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

@Injectable({
  providedIn: 'root'
})
export class StatsService extends BaseService {

  protected disks: any[] = [];
  protected broadcast;
  protected subscribers: number = 0;
  protected realtimeEvents;
  protected diskQueryEvents;

  constructor() { 
    super();
  }

  protected onAuthenticated(evt: CoreEvent){
    this.authenticated = true;
   
    // TODO: use disk.query to detect drive change events
    this.diskQueryEvents = this.websocket.sub("disk.query").subscribe((res) => {
      this.core.emit({name: "DiskStateChanged", data: res, sender: this});
    });
   

    const queryOptions = {"select":["name", "type"]};

    if(this.subscribers > 0 && !this.realtimeEvents){
      this.realtimeEvents = this.websocket.sub("reporting.realtime").subscribe((res) => {
        this.core.emit({name: "RealtimeStats", data: res, sender: this});
      });
    }
  }

}
