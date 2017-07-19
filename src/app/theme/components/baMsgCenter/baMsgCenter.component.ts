import {Component} from '@angular/core';
import { RestService } from '../../../services';


@Component({
  selector : 'ba-msg-center',
  styleUrls : [ './baMsgCenter.scss' ],
  templateUrl : './baMsgCenter.html'
})
export class BaMsgCenter {
  public notifications: Array<Object>;
  public messages: Array<Object>;
  public notification_count: number = 0;

   constructor(private rest: RestService) {
  }

  public getMessages() : Array<Object> {
    return this.messages;
  }

  public getNotifications() : Array<Object> {
    this.rest.get( "system/alert/", {}).subscribe((res) => {
      this.notifications = res.data;
    });
    this.notification_count = this.notifications.length;
    return this.notifications; 
  };
}
