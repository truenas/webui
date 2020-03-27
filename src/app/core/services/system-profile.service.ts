import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

interface InfoObject {
  version: string; // "TrueNAS-12.0-MASTER-202003160424"
  buildtime: any[]; // [{…}]
  hostname: string; // "truenas.local"
  physmem: number; // 8445599744
  model: string; // "Intel(R) Core(TM) i3-2100T CPU @ 2.50GHz"
  cores: number; // 4
  loadavg: number[]; // [0.15380859375, 0.24169921875, 0.22900390625]
  uptime: string; // "4:25PM  up 7 days, 37 mins"
  uptime_seconds: number; // 607039.9912204742
  system_serial: string;
  system_product: string;
  license: any;
  boottime: any; // {$date: 1584373672000}
  datetime: any; // {$date: 1585005911991}
  timezone: string; // "America/Los_Angeles"
  system_manufacturer: string; // null
  ecc_memory: boolean; // false
}

@Injectable({
  providedIn: 'root'
})
export class SystemProfileService extends BaseService {

  public cache: any;
  private buffer: CoreEvent[] = [];
  private emulateHardware?: InfoObject;
  private mini: InfoObject = {
    version: "TrueNAS-12.0-MASTER-202003160424",
    buildtime: [],
    hostname: "truenas.local",
    physmem: 8445599744,
    model: "Intel(R) Core(TM) i3-2100T CPU @ 2.50GHz",
    cores: 4,
    loadavg: [0.15380859375, 0.24169921875, 0.22900390625],
    uptime: "4:25PM  up 7 days, 37 mins",
    uptime_seconds: 607039.9912204742,
    system_serial: '123456789',
    system_product: 'FREENAS-MINI-3.0',
    license: { model: 'FREENAS-MINI-3.0'},
    boottime: {$date: 1584373672000},
    datetime: {$date: 1585005911991},
    timezone: "America/Los_Angeles",
    system_manufacturer: 'ixsystems',
    ecc_memory: true,
  }

  public features= {
    HA: false,
    enclosure: false
  }

  constructor() { 
    super();

    this.core.register({
      observerClass: this,
      eventName: "SysInfoRequest"
    }).subscribe((evt:CoreEvent) => {
      const ready = this.dataAvailable(evt);
      if(ready){
        this.respond({name:"SysInfoRequest", sender: this});
      }
    });
  }

  protected onAuthenticated(evt: CoreEvent){
    this.authenticated = true;
  }

  private dataAvailable(evt: CoreEvent){  
    if(this.cache && this.authenticated){
      return true;
    } else if(!this.cache && this.authenticated ){
      if(this.buffer.length == 0){ 
        this.fetchProfile();
      }
      this.buffer.push(evt);
      return false;
    } else if(!this.authenticated){
      return false;
    }
  }

  fetchProfile(localOnly?: boolean){
    this.websocket.call('system.info').subscribe((res) => {
      this.cache = res;
      if(localOnly){ 
        this.buffer.push({name:"SysInfoRequest", sender: this});
        return; 
      }
      
      if(this.buffer.length > 0){
        this.clearBuffer();
      }
    });
  }

  clearBuffer(){
    this.buffer.forEach((evt) => {
      this.respond(evt);
    });
  }

  respond(evt: CoreEvent){
    let data;
    let responseEvent;
    switch(evt.name){
      case 'SysInfoRequest':
        data = this.cache;
        responseEvent = 'SysInfo';
        break;
    }
    this.detectFeatures(data);
    data.features = this.features;
    this.core.emit({name:responseEvent, data: data, sender: this});
  }

  detectFeatures(profile:any){
    if(profile.system_product.includes('FREENAS-MINI-3.0') || profile.system_product.includes('TRUENAS-')){
      this.features.enclosure = true;
    } 
  }

}
