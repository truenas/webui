

import {Injectable, EventEmitter} from '@angular/core';
import {Http} from '@angular/http';
import {Observable, Subject, Subscription} from 'rxjs/Rx';

import {RestService} from './rest.service';
import {WebSocketService} from './ws.service';

@Injectable()
export class SystemGeneralService {

  protected certificateList: string = 'certificate.query';
  protected caList: string = 'certificateauthority.query';
  shouldReboot = new EventEmitter();
  rebootStatus = new Subject<string>();
  reboot: string;

  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getCA() { return this.ws.call(this.caList, []); }

  getCertificates() { return this.ws.call(this.certificateList); }

  getUnsignedCertificates() {
	  return this.ws.call(this.certificateList, [[["CSR", "!=", null]]]);
  }

  getUnsignedCAs() {
    return this.ws.call(this.caList, [[["privatekey", "!=", null]]]);
  }

  getIPChoices() {
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ]);
  }

  getSysInfo() {
    return this.ws.call('system.info', []);
  }

  setRebootStatus(status: string) {
    this.rebootStatus.next(status);
    this.reboot = status;
  }

  getRebootStatus() {
    return this.rebootStatus.asObservable();
  }

  
}