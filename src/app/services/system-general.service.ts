import 'rxjs/add/operator/map';

import {Injectable} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable()
export class SystemGeneralService {

  protected certificateList: string = 'certificate.query';

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getCA() { return this.ws.call('certificateauthority.query', []); }

  getCertificates() { return this.ws.call(this.certificateList); }

  getIPChoices() {
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ]);
  }
}