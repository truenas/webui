import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';
import { WebSocketService } from 'app/services/ws.service';

export interface Temperature {
  keys: string[];
  values: any;
  unit: string;
  symbolText: string;
}

@Injectable({
  providedIn: 'root'
})
export class DiskStateService extends BaseService {

  constructor(protected ws: WebSocketService) { 
    super();
    console.log("DISK STATE SERVICE INIT...");
  }

  protected onAuthenticated(evt: CoreEvent){
    this.authenticated = true;
    console.log("DISK STATE SUBSCRIBING TO EVENTS...");
    this.ws.sub("disk.query").subscribe((res) =>{
      console.log("DISK STATE EVENT FROM MIDDLEWARE...");
      this.core.emit({name:"DisksChanged", data: res, sender: this});
    });
  }

}
