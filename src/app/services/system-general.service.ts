import { EventEmitter, Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as _ from 'lodash';
import { map } from 'rxjs/operators';
import { RestService } from './rest.service';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root'})
export class SystemGeneralService {

  protected certificateList = 'certificate.query';
  protected caList = 'certificateauthority.query';
  
  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject();
  sendConfigData$ = new Subject();
  refreshSysGeneral$ = new Subject();
  generalConfigInfo: any;
  sendGenConfigInfo$ = new Subject();
  
  constructor(protected rest: RestService, protected ws: WebSocketService) {};

  getCA() { return this.ws.call(this.caList, []); }

  getCertificates() { return this.ws.call(this.certificateList); }

  getUnsignedCertificates() {
	  return this.ws.call(this.certificateList, [[["CSR", "!=", null]]]);
  }

  getUnsignedCAs() {
    return this.ws.call(this.caList, [[["privatekey", "!=", null]]]);
  }

  getCertificateCountryChoices() {
    return this.ws.call('certificate.country_choices');
  }
 
  getIPChoices() {
    return this.ws.call('notifier.choices', [ 'IPChoices', [ true, false ] ]);
  }

  getSysInfo() {
    return this.ws.call('system.info', []);
  }

  ipChoicesv4() {
    return this.ws.call("system.general.ui_address_choices", []).pipe(
      map(response =>
        Object.keys(response || {}).map(key => ({
          label: response[key],
          value: response[key]
        }))
      )
    );
  }

  ipChoicesv6() {
    return this.ws.call("system.general.ui_v6address_choices", []).pipe(
      map(response =>
        Object.keys(response || {}).map(key => ({
          label: response[key],
          value: response[key]
        }))
      )
    );
  }

  kbdMapChoices() {
    return this.ws.call("system.general.kbdmap_choices", []).pipe(
      map(response =>
        Object.keys(response || {}).map(key => ({
          label: `${response[key]} (${key})`,
          value: key
        }))
      )
    );
  }

  languageChoices() {
    return this.ws.call("system.general.language_choices");
  }

  timezoneChoices() {
    return this.ws.call("system.general.timezone_choices", []).pipe(
      map(response =>
        Object.keys(response || {}).map(key => ({
          label: response[key],
          value: key
        }))
      )
    );
  }

  refreshDirServicesCache() {
    return this.ws.call('directoryservices.cache_refresh');
  }

  updateDone() {
    this.updateIsDone$.next();
  }

  sendConfigData(data: any) {
    this.sendConfigData$.next(data);
  }

  refreshSysGeneral() {
    this.refreshSysGeneral$.next();
  }
 
  checkRootPW(password) {
    return this.ws.call('auth.check_user', ['root', password]);
  }
  counter = 0;
  getGeneralConfig = new Observable<any>(observer => {
    if((!this.generalConfigInfo || _.isEmpty(this.generalConfigInfo)) && this.counter === 0) {
      this.counter++;
      console.log('making api call')
      this.ws.call('system.general.config').subscribe(res => {
        this.generalConfigInfo = res;
        observer.next(this.generalConfigInfo);
      })
    } else {
      setTimeout(() => {
        observer.next(this.generalConfigInfo);
        console.log('just sending', this.generalConfigInfo, this.counter)
      }, 100)
    }
    setTimeout(() => {
      this.generalConfigInfo = {};
      this.counter = 0;
    }, 5000)
  });


}
