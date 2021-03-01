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

  // Prevent repetitive api calls in a short time when data is already available
  public generalConfigInfo: any;
  public getGeneralConfig = new Observable<any>(observer => {
    if(!this.ws.loggedIn) {
      return observer.next({});
    }
    if((!this.generalConfigInfo || _.isEmpty(this.generalConfigInfo))) {
      // Since the api call can be made many times before the first response comes back, 
      // set waiting to true to make if condition false after the first call
      this.generalConfigInfo = { waiting: true};
      this.ws.call('system.general.config').subscribe(res => {
        this.generalConfigInfo = res;
        observer.next(this.generalConfigInfo);
      })
    } else {
      // Check every ten ms to see if the object is ready, then stop checking and send the obj
      const wait = setInterval(() => {
        if (this.generalConfigInfo && !this.generalConfigInfo.waiting) {
          clearInterval(wait);
          observer.next(this.generalConfigInfo);
        }
      }, 10)
    }
    // After a pause, set object to empty so calls can be made
    setTimeout(() => {
      this.generalConfigInfo = {};
    }, 2000)
  });

  public advancedConfigInfo: any;
  public getAdvancedConfig = new Observable<any>(observer => {
    if((!this.advancedConfigInfo || _.isEmpty(this.advancedConfigInfo))) {
      this.advancedConfigInfo = { waiting: true};
      this.ws.call('system.advanced.config').subscribe(res => {
        this.advancedConfigInfo = res;
        observer.next(this.advancedConfigInfo);
      })
    } else {
      const wait = setInterval(() => {
        if (this.advancedConfigInfo && !this.advancedConfigInfo.waiting) {
          clearInterval(wait);
          observer.next(this.advancedConfigInfo);
        }
      }, 10)
    }
    setTimeout(() => {
      this.advancedConfigInfo = {};
    }, 2000)
  });

  public productType = '';
  public getProductType = new Observable<string>(observer => {
    if (!this.productType) {
      this.productType = 'pending';
      this.ws.call('system.product_type').subscribe(res => {
        this.productType = res;
        observer.next(this.productType);
      })
    } else {
      const wait = setInterval(() => {
        if (this.productType !== 'pending') {
          clearInterval(wait);
          observer.next(this.productType);
        }
      }, 10)
    }
    setTimeout(() => {
      this.productType = '';
    }, 5000)

  })
  
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
}
