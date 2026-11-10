import { Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe } from 'rxjs';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface ContainerConfigState {
  isLoading: boolean;
  config: ContainerGlobalConfig | null;
}

const initialState: ContainerConfigState = {
  isLoading: false,
  config: null,
};

@Injectable()
export class ContainerConfigStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly config = this.state.config;

  readonly initialize = rxMethod<void>(pipe(
    // exhaustMap ignores new triggers while a request is in progress,
    // preventing duplicate API calls during rapid navigation
    exhaustMap(() => {
      patchState(this.state, { isLoading: true });

      return this.api.call('lxc.config').pipe(
        tapResponse({
          next: (config) => patchState(this.state, { config }),
          error: (error: unknown) => this.errorHandler.showErrorModal(error),
          finalize: () => patchState(this.state, { isLoading: false }),
        }),
      );
    }),
  ));
}
