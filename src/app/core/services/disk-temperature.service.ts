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
  providedIn: 'root'
})
export class DiskTemperatureService extends BaseService {

  protected disks: any[] = [];
  protected broadcast;
  protected subscribers: number = 0;

  constructor() { 
    super();

    this.core.register({observerClass: this, eventName:"DiskTemperaturesSubscribe"}).subscribe((evt: CoreEvent) => {
      this.subscribers++
      if(!this.broadcast){
        this.start();
      }
    });

    this.core.register({observerClass: this, eventName:"DiskTemperaturesUnsubscribe"}).subscribe((evt: CoreEvent) => {
      this.subscribers--
      if(this.subscribers == 0){
        this.stop();
      }
    });
  }

  protected onAuthenticated(evt: CoreEvent){
    this.authenticated = true;
   
    // TODO: use disk.query to detect drive change events
    const queryOptions = {"select":["name", "type"]};
    this.websocket.call('disk.query',[[], queryOptions]).subscribe((res) =>{
      this.disks = res; //.filter(v => v.type == "HDD");
      if(this.subscribers > 0){
        this.start();
      }
    });
  }

  start(){
    let tally = 0;
    this.broadcast = setInterval(()=>{
      this.fetch(this.disks.map(v => v.name));
      tally++
    }, 2000);
  }

  stop(){
    clearInterval(this.broadcast);
    delete this.broadcast;
  }

  fetch(disks: string[]){
    this.websocket.call('disk.temperatures', [disks]).subscribe((res) =>{
      const data: Temperature = {
        keys: Object.keys(res),
        values: res,
        unit: "Celsius",
        symbolText: "°"
      }
      this.core.emit({name:"DiskTemperatures", data: data, sender:this});
    });
  }
}
