import 'rxjs/add/operator/map';

import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable, Subject, Subscription } from 'rxjs/Rx';

import { EntityUtils } from '../pages/common/entity/utils'
import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable()
export class TaskService {

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getMonthChoices() {
    return this.ws.call('notifier.choices', ['MONTHS_CHOICES', [true, false]]);
  };

  getWeekdayChoices() {
    return this.ws.call('notifier.choices', ['WEEKDAYS_CHOICES', [true, false]]);
  };
}
