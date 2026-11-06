import { Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { NetworkInterface, toNetworkInterface } from 'app/interfaces/network-interface.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface InterfacesState {
  interfaces: NetworkInterface[];
  isLoading: boolean;
}

const initialState: InterfacesState = {
  interfaces: [],
  isLoading: false,
};

@Injectable()
export class InterfacesStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly interfaces = this.state.interfaces;
  readonly isLoading = this.state.isLoading;

  readonly loadInterfaces = rxMethod<void>(pipe(
    tap(() => patchState(this.state, { isLoading: true })),
    switchMap(() => {
      return this.api.query('interface.query').pipe(
        map((interfaces) => interfaces.map(toNetworkInterface)),
        tapResponse({
          next: (interfaces) => patchState(this.state, { interfaces }),
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));
}
