import { EventEmitter, Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { fromUnixTime } from 'date-fns';
import * as _ from 'lodash';
import {
  Subject, Observable,
} from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  private productType: ProductType;
  protected certificateList = 'certificate.query' as const;
  protected caList = 'certificateauthority.query' as const;

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject<void>();

  get isEnterprise(): boolean {
    return this.getProductType() === ProductType.ScaleEnterprise;
  }

  getProductType(): ProductType {
    return this.productType;
  }

  loadProductType(): Observable<void> {
    return this.getProductType$.pipe(
      map((productType) => {
        this.productType = productType;
        return undefined;
      }),
    );
  }

  getProductType$ = this.ws.call('system.product_type').pipe(shareReplay({ refCount: false, bufferSize: 1 }));

  readonly isEnterprise$ = this.getProductType$.pipe(
    map((productType) => productType === ProductType.ScaleEnterprise),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  getCopyrightYear$ = this.ws.call('system.build_time').pipe(
    map((buildTime) => {
      return fromUnixTime(buildTime.$date / 1000).getFullYear();
    }),
    shareReplay({ refCount: false, bufferSize: 1 }),
  );

  constructor(
    protected ws: WebSocketService,
    @Inject(WINDOW) private window: Window,
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

  refreshDirServicesCache(): Observable<Job> {
    return this.ws.job('directoryservices.cache_refresh');
  }

  updateDone(): void {
    this.updateIsDone$.next();
  }
}
