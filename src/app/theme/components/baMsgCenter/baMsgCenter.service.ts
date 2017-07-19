import { RestService } from '../../../services';
import { Injectable } from '@angular/core'

@Injectable() export class
BaMsgCenterService {
  private notifications: Array<Object> = [];
  private messages: Array<Object> = [];

  constructor(private rest: RestService) {
  }

  public getMessages() : Array<Object> {
    return this.messages;
  }

  public getNotifications() : Array<Object> {
    this.rest.get( "system/alert/", {}).subscribe((res) => {
      this.notifications = res.data;
    });
    return this.notifications;
  }

};
