import { Component } from '@angular/core';
import { RestService } from '../../../services';
import { BaMsgCenterService } from './baMsgCenter.service'


@Component({
  selector : 'ba-msg-center',
  providers: [BaMsgCenterService],
  styleUrls : [ './baMsgCenter.scss' ],
  templateUrl : './baMsgCenter.html'
})
export class BaMsgCenter {
  public alerts: Array<Object>;
  public messages: Array<Object>;

  constructor(private rest: RestService, public msgService: BaMsgCenterService) {
  }

  public getMessages() : Array<Object> {
    return this.messages;
  }

  public refreshAlerts() : Array<Object> {
    return this.msgService.fetchAlerts(); 
  };


}
