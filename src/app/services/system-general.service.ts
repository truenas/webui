import { EventEmitter, Injectable } from '@angular/core';
import * as _ from 'lodash';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  protected certificateList = 'certificate.query' as const;
  protected caList = 'certificateauthority.query' as const;

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject();
  sendConfigData$ = new Subject<SystemGeneralConfig>();
  refreshSysGeneral$ = new Subject();

  // Prevent repetitive api calls in a short time when data is already available
  generalConfigInfo: SystemGeneralConfig | { waiting: true };
  getGeneralConfig$ = new Observable<SystemGeneralConfig>((observer) => {
    if (!this.ws.loggedIn) {
      observer.next({} as SystemGeneralConfig);
      return;
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
        if (this.generalConfigInfo && !(this.generalConfigInfo as { waiting?: true }).waiting) {
          clearInterval(wait);
          observer.next(this.generalConfigInfo as SystemGeneralConfig);
        }
      }, 10);
    }
    // After a pause, set object to empty so calls can be made
    setTimeout(() => {
      this.generalConfigInfo = {} as SystemGeneralConfig;
    }, 2000);
  });

  advancedConfigInfo: AdvancedConfig | { waiting: true };
  getAdvancedConfig$ = new Observable<AdvancedConfig>((observer) => {
    if ((!this.advancedConfigInfo || _.isEmpty(this.advancedConfigInfo))) {
      this.advancedConfigInfo = { waiting: true };
      this.ws.call('system.advanced.config').subscribe((advancedConfig) => {
        this.advancedConfigInfo = advancedConfig;
        observer.next(this.advancedConfigInfo);
      });
    } else {
      const wait = setInterval(() => {
        if (this.advancedConfigInfo && !(this.advancedConfigInfo as { waiting: true }).waiting) {
          clearInterval(wait);
          observer.next(this.advancedConfigInfo as AdvancedConfig);
        }
      }, 10);
    }
    setTimeout(() => {
      this.advancedConfigInfo = {} as AdvancedConfig;
    }, 2000);
  });

  productType = '';
  getProductType$ = new Observable<string>((observer) => {
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

  /**
   * OAuth token for JIRA access
   * used on `support.new_ticket`, `support.get_categories` and `support.attach_ticket` endpoints
   */
  private jiraToken: string;

  constructor(protected ws: WebSocketService) {}

  getCA(): Observable<CertificateAuthority[]> {
    return this.ws.call(this.caList, []);
  }

  getCertificates(): Observable<Certificate[]> {
    return this.ws.call(this.certificateList);
  }

  getUnsignedCertificates(): Observable<Certificate[]> {
    return this.ws.call(this.certificateList, [[['CSR', '!=', null]]]);
  }

  getUnsignedCAs(): Observable<CertificateAuthority[]> {
    return this.ws.call(this.caList, [[['privatekey', '!=', null]]]);
  }

  getCertificateCountryChoices(): Observable<Choices> {
    return this.ws.call('certificate.country_choices');
  }

  getSysInfo(): Observable<SystemInfo> {
    return this.ws.call('system.info');
  }

  ipChoicesv4(): Observable<Choices> {
    return this.ws.call('system.general.ui_address_choices');
  }

  ipChoicesv6(): Observable<Choices> {
    return this.ws.call('system.general.ui_v6address_choices');
  }

  kbdMapChoices(): Observable<Option[]> {
    return this.ws.call('system.general.kbdmap_choices').pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: `${response[key]} (${key})`,
          value: key,
        }))),
    );
  }

  languageChoices(): Observable<Choices> {
    return this.ws.call('system.general.language_choices');
  }

  languageOptions(sortLanguagesByName: boolean): Observable<Option[]> {
    return this.languageChoices().pipe(map((languageList: Choices): Option[] => {
      let options = Object.keys(languageList || {}).map((key) => ({
        label: sortLanguagesByName
          ? `${languageList[key]} (${key})`
          : `${key} (${languageList[key]})`,
        value: key,
      }));
      options = _.sortBy(
        options,
        sortLanguagesByName ? 'label' : 'value',
      );
      return options;
    }));
  }

  timezoneChoices(): Observable<Option[]> {
    return this.ws.call('system.general.timezone_choices').pipe(
      map((response) =>
        Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: key,
        }))),
    );
  }

  uiCertificateOptions(): Observable<Choices> {
    return this.ws.call('system.general.ui_certificate_choices');
  }

  uiHttpsProtocolsOptions(): Observable<Choices> {
    return this.ws.call('system.general.ui_httpsprotocols_choices');
  }

  refreshDirServicesCache(): Observable<void> {
    return this.ws.call('directoryservices.cache_refresh');
  }

  updateDone(): void {
    this.updateIsDone$.next();
  }

  sendConfigData(data: SystemGeneralConfig): void {
    this.sendConfigData$.next(data);
  }

  refreshSysGeneral(): void {
    this.refreshSysGeneral$.next();
  }

  checkRootPW(password: string): Observable<boolean> {
    return this.ws.call('auth.check_user', ['root', password]);
  }

  /**
   *
   * @returns OAuth Token for JIRA
   */
  getTokenForJira(): string {
    return this.jiraToken;
  }

  /**
   * Accepts string and set it as token
   * @param token
   */
  setTokenForJira(token: string): void {
    this.jiraToken = token;
  }
}
