import { computed, Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  of, exhaustMap, tap, EMPTY,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
export class ContainerConfigStore extends ComponentStore<ContainerConfigState> {
  private api = inject(TypedApiService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly config = computed(() => this.state().config);

  constructor() {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      // exhaustMap ignores new triggers while a request is in progress,
      // preventing duplicate API calls during rapid navigation
      exhaustMap(() => {
        // Skip if already loading
        if (this.state().isLoading) {
          return EMPTY;
        }

        this.patchState({ isLoading: true });

        return this.api.call('lxc.config').pipe(
          tap((config) => {
            this.patchState({
              config,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
    );
  });
}
