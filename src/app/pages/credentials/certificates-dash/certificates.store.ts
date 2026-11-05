import { Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Certificate, toCertificate } from 'app/interfaces/certificate.interface';
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
export class CertificatesStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly certificates = this.state.certificates;
  readonly csrs = this.state.csrs;

  readonly loadCertificates = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap(() => {
      return this.api.query('certificate.query').pipe(
        map((entries) => entries.map(toCertificate)),
        tapResponse({
          next: (allCertificates) => {
            patchState(this.state, {
              isLoading: false,
              certificates: allCertificates.filter((cert) => cert.certificate !== null),
              csrs: allCertificates.filter((cert) => cert.CSR !== null),
            });
          },
          error: (error: unknown) => {
            patchState(this.state, { isLoading: false });
            this.errorHandler.showErrorModal(error);
          },
        }),
      );
    }),
  ));
}
