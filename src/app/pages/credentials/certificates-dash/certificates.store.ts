import { computed, Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, of, tap } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Certificate } from 'app/interfaces/certificate.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

interface CertificatesState {
  isLoading: boolean;
  certificates: Certificate[];
  csrs: Certificate[];
}

const initialState: CertificatesState = {
  isLoading: false,
  certificates: [],
  csrs: [],
};

@Injectable()
export class CertificatesStore extends ComponentStore<CertificatesState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly certificates = computed(() => this.state().certificates);
  readonly csrs = computed(() => this.state().csrs);

  constructor() {
    super(initialState);
  }

  readonly loadCertificates = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          isLoading: true,
        });
      }),
      switchMap(() => {
        return this.api.call('certificate.query').pipe(
          tap((allCertificates) => {
            const certificates = allCertificates.filter((cert) => cert.certificate !== null);
            const csrs = allCertificates.filter((cert) => cert.CSR !== null);

            this.patchState({
              isLoading: false,
              certificates,
              csrs,
            });
          }),
          catchError((error: unknown) => {
            this.patchState({
              isLoading: false,
            });
            this.errorHandler.showErrorModal(error);
            return of(null);
          }),
        );
      }),
    );
  });
}
