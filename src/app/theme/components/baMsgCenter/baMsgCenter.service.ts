import { RestService } from '../../../services';
import { Injectable } from '@angular/core'

@Injectable() export class
BaMsgCenterService {
  private notifications: Array<Object> = [];
  private messages: Array<Object> = [];

  constructor(private rest: RestService) {
    this.rest.get( "system/alert/", {}).subscribe((res) => {
      // for(let item in res.data){
      //   res.data[item].level;
      //   res.data[item].message;
      //   debugger;
      // };
      debugger;
      this.notifications = res.data;
    });
  }

  public getMessages() : Array<Object> {
    return this.messages;
  }

  public getNotifications() : Array<Object> {
    return this.notifications;
  }

};
