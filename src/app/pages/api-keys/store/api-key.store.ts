import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { EMPTY } from 'rxjs';
import {
  catchError, switchMap, tap,
} from 'rxjs/operators';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface ApiKeysState {
  isLoading: boolean;
  error: string;
  entities: ApiKey[];
}

const initialState: ApiKeysState = {
  isLoading: false,
  entities: [],
  error: null,
};

@Injectable()
export class ApiKeyComponentStore extends ComponentStore<ApiKeysState> {
  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialog: DialogService,
  ) {
    super(initialState);
  }

  readonly isLoading$ = this.select((state) => state.isLoading);
  readonly isError$ = this.select((state) => state.error);
  readonly apiKeys$ = this.select((state) => state.entities);

  readonly loadApiKeys = this.effect((triggers$) => {
    return triggers$.pipe(
      tap(() => {
        this.setState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return this.ws.call('api_key.query').pipe(
          tap((keys) => {
            this.patchState({
              entities: keys,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.dialog.error(this.errorHandler.parseError(error));
            this.patchState({
              isLoading: false,
              error: 'API Keys could not be loaded',
            });

            return EMPTY;
          }),
        );
      }),
    );
  });

  apiKeyAdded = this.updater((state, key: ApiKey) => ({
    ...state,
    entities: [...state.entities, key],
  }));

  apiKeyEdited = this.updater((state, key: ApiKey) => {
    const index = state.entities.findIndex((entity) => entity.id === key.id);

    return {
      ...state,
      entities: [
        ...state.entities.slice(0, index),
        key,
        ...state.entities.slice(index + 1),
      ],
    };
  });

  apiKeyDeleted = this.updater((state, apiKeyId: number) => {
    const index = state.entities.findIndex((entity) => entity.id === apiKeyId);

    return {
      ...state,
      entities: [
        ...state.entities.slice(0, index),
        ...state.entities.slice(index + 1),
      ],
    };
  });
}
