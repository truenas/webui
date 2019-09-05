import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';

@Injectable({
  providedIn: 'root'
})
export class SystemProfileService extends BaseService {

  public cache: any;
  private buffer: CoreEvent[] = [];

  constructor() { 
    super();

    this.core.register({
      observerClass: this,
      eventName: "SysInfoRequest"
    }).subscribe((evt:CoreEvent) => {
      const ready = this.dataAvailable(evt);
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

    this.core.emit({name:responseEvent, data: data, sender: this});
  }

}
