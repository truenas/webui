import { EventEmitter, Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { sortBy } from 'lodash-es';
import {
  Subject, Observable,
  of, switchMap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { languages } from 'app/constants/languages.constant';
import { helptextSystemGeneral } from 'app/helptext/system/general';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Injectable({ providedIn: 'root' })
export class SystemGeneralService {
  protected api = inject(ApiService);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);

  protected certificateList = 'certificate.query' as const;

  updateRunning = new EventEmitter<string>();
  updateRunningNoticeSent = new EventEmitter<string>();
  updateIsDone$ = new Subject<void>();

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

  /**
   * Shows confirmation dialog for UI service restart and optionally performs the restart.
   * @returns Observable<true> that completes when the operation is finished.
   */
  handleUiServiceRestart(): Observable<true> {
    return this.dialog
      .confirm({
        title: this.translate.instant(helptextSystemGeneral.restartTitle),
        message: this.translate.instant(helptextSystemGeneral.restartMessage),
      })
      .pipe(
        switchMap((shouldRestart): Observable<true> => {
          if (!shouldRestart) {
            return of(true);
          }
          return this.api.call('system.general.ui_restart').pipe(
            this.errorHandler.withErrorHandler(),
            map(() => true),
          );
        }),
      );
  }
}
