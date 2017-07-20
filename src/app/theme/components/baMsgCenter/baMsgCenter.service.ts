import { RestService } from '../../../services';
import { Injectable } from '@angular/core'

@Injectable() export class
BaMsgCenterService {
  public alerts: Array<Object> = [];
  public messages: Array<Object> = [];

  constructor(private rest: RestService) {
  }

  public getMessages() : Array<Object> {
    return this.messages;
  }

  public fetchAlerts() : Array<Object> {
    this.rest.get( "system/alert/", {}).subscribe((res) => {
      this.alerts = res.data;
    });
    return this.alerts;
  }

};
