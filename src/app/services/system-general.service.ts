import { EventEmitter, Injectable, inject } from '@angular/core';
import { sortBy } from 'lodash-es';
import {
  Subject, Observable,
  of,
} from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { languages } from 'app/constants/languages.constant';
import { ProductType } from 'app/enums/product-type.enum';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { ApiService } from 'app/modules/websocket/api.service';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  protected api = inject(ApiService);

  private productType: ProductType;
  protected certificateList = 'certificate.query' as const;

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject<void>();

  /**
   * @deprecated
   * Use selectIsEnterprise selector instead
   */
  get isEnterprise(): boolean {
    return this.getProductType() === ProductType.Enterprise;
  }

  /**
   * @deprecated
   * Use selectProductType selector instead
   */
  getProductType(): ProductType {
    return this.productType;
  }

  loadProductType(): Observable<void> {
    return this.getProductType$.pipe(
      map((productType): void => {
        this.productType = productType;
        return undefined;
      }),
    );
  }

  /**
   * @deprecated
   * Use selectProductType selector instead
   */
  getProductType$ = this.api.call('system.product_type').pipe(shareReplay({ refCount: false, bufferSize: 1 }));

  /**
   * @deprecated
   * Use selectIsEnterprise selector instead
   */
  readonly isEnterprise$ = this.getProductType$.pipe(
    map((productType) => productType === ProductType.Enterprise),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  getCertificates(): Observable<Certificate[]> {
    return this.api.call(this.certificateList);
  }

  getCertificateCountryChoices(): Observable<Choices> {
    return this.api.call('certificate.country_choices');
  }

  ipChoicesv4(): Observable<Choices> {
    return this.api.call('system.general.ui_address_choices');
  }

  ipChoicesv6(): Observable<Choices> {
    return this.api.call('system.general.ui_v6address_choices');
  }

  kbdMapChoices(): Observable<Option[]> {
    return this.api.call('system.general.kbdmap_choices').pipe(
      map((response) => {
        return Object.keys(response || {}).map((key) => ({
          label: `${response[key]} (${key})`,
          value: key,
        }));
      }),
    );
  }

  languageOptions(sortLanguagesByName: boolean): Observable<Option[]> {
    let options: Option[] = [...languages.keys()].map((code) => ({
      label: sortLanguagesByName
        ? `${languages.get(code)} (${code})`
        : `${code} (${languages.get(code)})`,
      value: code,
    }));

    options = sortBy(
      options,
      sortLanguagesByName ? 'label' : 'value',
    );

    return of(options);
  }

  timezoneChoices(): Observable<Option[]> {
    return this.api.call('system.general.timezone_choices').pipe(
      map((response) => {
        return Object.keys(response || {}).map((key) => ({
          label: response[key],
          value: key,
        }));
      }),
    );
  }

  uiCertificateOptions(): Observable<Choices> {
    return this.api.call('system.general.ui_certificate_choices');
  }

  uiHttpsProtocolsOptions(): Observable<Choices> {
    return this.api.call('system.general.ui_httpsprotocols_choices');
  }

  refreshDirServicesCache(): Observable<Job> {
    return this.api.job('directoryservices.cache_refresh');
  }

  updateDone(): void {
    this.updateIsDone$.next();
  }
}
