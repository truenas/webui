import { EventEmitter, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { Subject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { WebSocketService } from './ws.service';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  protected certificateList = 'certificate.query' as const;
  protected caList = 'certificateauthority.query' as const;

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject();

  toggleSentryInit(): void {
    combineLatest([
      this.isStable(),
      this.getSysInfo(),
      this.store$.pipe(waitForGeneralConfig),
    ]).subscribe(([isStable, sysInfo, generalConfig]) => {
      if (!isStable && generalConfig.crash_reporting) {
        Sentry.init({
          dsn: environment.sentryPublicDsn,
          release: sysInfo.version,
        });
      } else {
        Sentry.init({
          enabled: false,
        });
      }
    });
  }

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

  constructor(
    protected ws: WebSocketService,
    private store$: Store<AppState>,
  ) {}

  getCertificateAuthorities(): Observable<CertificateAuthority[]> {
    return this.ws.call(this.caList, []);
  }

  getCertificates(): Observable<Certificate[]> {
    return this.ws.call(this.certificateList);
  }

  getUnsignedCertificates(): Observable<Certificate[]> {
    return this.ws.call(this.certificateList, [[['CSR', '!=', null]]]);
  }

  getUnsignedCas(): Observable<CertificateAuthority[]> {
    return this.ws.call(this.caList, [[['privatekey', '!=', null]]]);
  }

  getCertificateCountryChoices(): Observable<Choices> {
    return this.ws.call('certificate.country_choices');
  }

  isStable(): Observable<boolean> {
    return this.ws.call('system.is_stable');
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
      map((response) => {
        return Object.keys(response || {}).map((key) => ({
          label: `${response[key]} (${key})`,
          value: key,
        }));
      }),
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
      map((response) => {
        return Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: key,
        }));
      }),
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

  /**
   *
   * @returns OAuth Token for JIRA
   */
  getTokenForJira(): string {
    return this.jiraToken;
  }

  /**
   * Accepts string and set it as token
   */
  setTokenForJira(token: string): void {
    this.jiraToken = token;
  }
}
