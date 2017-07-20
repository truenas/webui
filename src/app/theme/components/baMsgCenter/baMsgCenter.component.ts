import { Component, OnDestroy } from '@angular/core';
import { RestService } from '../../../services';
import { BaMsgCenterService } from './baMsgCenter.service'


@Component({
  selector : 'ba-msg-center',
  providers: [BaMsgCenterService],
  styleUrls : [ './baMsgCenter.scss' ],
  templateUrl : './baMsgCenter.html'
})
export class BaMsgCenter implements OnDestroy{
  public alerts: Array<Object> = [];
  public messages: Array<Object> = [];
  private subscription: any;

  constructor(private rest: RestService, private msgService: BaMsgCenterService) {
    this.subscription = msgService.onAlert.subscribe((value) => {
      this.getAlerts();
    })
  }

  public getMessages() : Array<Object> {
    return this.messages = this.msgService.getMessages();
  }

  public getAlerts() : Array<Object> {
    return this.alerts = this.msgService.getAlerts();
  }

  public refreshAlerts() : void {
    this.msgService.fetchAlerts(); 
  };

  ngOnDestroy() {
    this.subscription.unsubscribe();
  };


}
