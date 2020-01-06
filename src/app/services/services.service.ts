import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {EntityUtils} from '../pages/common/entity/utils'
import {WebSocketService} from './ws.service';

@Injectable()
export class ServicesService {
  constructor(protected ws: WebSocketService) {};
  
  getSmbBindIPChoices() {
    return this.ws.call('smb.bindip_choices');
  }
}
