import { EventEmitter, Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  protected certificateList: 'certificate.query' = 'certificate.query';
  protected caList: 'certificateauthority.query' = 'certificateauthority.query';

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject();
  sendConfigData$ = new Subject();
  refreshSysGeneral$ = new Subject();

  // Prevent repetitive api calls in a short time when data is already available
  generalConfigInfo: any;
  getGeneralConfig = new Observable<any>((observer) => {
    if (!this.ws.loggedIn) {
      return observer.next({});
    }
    if ((!this.generalConfigInfo || _.isEmpty(this.generalConfigInfo))) {
      // Since the api call can be made many times before the first response comes back,
      // set waiting to true to make if condition false after the first call
      this.generalConfigInfo = { waiting: true };
      this.ws.call('system.general.config').subscribe((configInfo) => {
        this.generalConfigInfo = configInfo;
        observer.next(this.generalConfigInfo);
      });
    } else {
      // Check every ten ms to see if the object is ready, then stop checking and send the obj
      const wait = setInterval(() => {
        if (this.generalConfigInfo && !this.generalConfigInfo.waiting) {
          clearInterval(wait);
          observer.next(this.generalConfigInfo);
        }
      }, 10);
    }
    // After a pause, set object to empty so calls can be made
    setTimeout(() => {
      this.generalConfigInfo = {};
    }, 2000);
  });

  advancedConfigInfo: any;
  getAdvancedConfig = new Observable<any>((observer) => {
    if ((!this.advancedConfigInfo || _.isEmpty(this.advancedConfigInfo))) {
      this.advancedConfigInfo = { waiting: true };
      this.ws.call('system.advanced.config').subscribe((advancedConfig) => {
        this.advancedConfigInfo = advancedConfig;
        observer.next(this.advancedConfigInfo);
      });
    } else {
      const wait = setInterval(() => {
        if (this.advancedConfigInfo && !this.advancedConfigInfo.waiting) {
          clearInterval(wait);
          observer.next(this.advancedConfigInfo);
        }
      }, 10);
    }
    setTimeout(() => {
      this.advancedConfigInfo = {};
    }, 2000);
  });

  productType = '';
  getProductType = new Observable<string>((observer) => {
    if (!this.productType) {
      this.productType = 'pending';
      this.ws.call('system.product_type').subscribe((res) => {
        this.productType = res;
        observer.next(this.productType);
      });
    } else {
      const wait = setInterval(() => {
        if (this.productType !== 'pending') {
          clearInterval(wait);
          observer.next(this.productType);
        }
      }, 10);
    }
    setTimeout(() => {
      this.productType = '';
    }, 5000);
  });

  constructor(protected ws: WebSocketService) {}

  getCA(): Observable<any[]> {
    return this.ws.call(this.caList, []);
  }

  getCertificates(): Observable<any[]> {
    return this.ws.call(this.certificateList);
  }

  getUnsignedCertificates(): Observable<any[]> {
	  return this.ws.call(this.certificateList, [[['CSR', '!=', null]]]);
  }

  getUnsignedCAs(): Observable<any[]> {
    return this.ws.call(this.caList, [[['privatekey', '!=', null]]]);
  }

  getCertificateCountryChoices(): Observable<any> {
    return this.ws.call('certificate.country_choices');
  }

  getIPChoices(): Observable<any> {
    return this.ws.call('notifier.choices', ['IPChoices', [true, false]]);
  }

  getSysInfo(): Observable<SystemInfo> {
    return this.ws.call('system.info', []);
  }

  ipChoicesv4(): Observable<any> {
    return this.ws.call('system.general.ui_address_choices', []).pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: response[key],
        }))),
    );
  }

  ipChoicesv6(): Observable<any> {
    return this.ws.call('system.general.ui_v6address_choices', []).pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: response[key],
        }))),
    );
  }

  kbdMapChoices(): Observable<Option[]> {
    return this.ws.call('system.general.kbdmap_choices', []).pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: `${response[key]} (${key})`,
          value: key,
        }))),
    );
  }

  languageChoices(): Observable<any> {
    return this.ws.call('system.general.language_choices');
  }

  timezoneChoices(): Observable<any> {
    return this.ws.call('system.general.timezone_choices', []).pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: key,
        }))),
    );
  }

  refreshDirServicesCache(): Observable<any> {
    return this.ws.call('directoryservices.cache_refresh');
  }

  updateDone(): void {
    this.updateIsDone$.next();
  }

  sendConfigData(data: any): void {
    this.sendConfigData$.next(data);
  }

  refreshSysGeneral(): void {
    this.refreshSysGeneral$.next();
  }

  checkRootPW(password: string): Observable<any> {
    return this.ws.call('auth.check_user', ['root', password]);
  }
}
