import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { map, switchMap, tap } from 'rxjs/operators';
import { NetworkInterface, toNetworkInterface } from 'app/interfaces/network-interface.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
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
export class InterfacesStore extends ComponentStore<InterfacesState> {
  private api = inject(TypedApiService);
  private errorHandler = inject(ErrorHandlerService);

  constructor() {
    super(initialState);
  }

  readonly loadInterfaces = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() => {
        return this.api.query('interface.query').pipe(
          map((interfaces) => interfaces.map(toNetworkInterface)),
          tap({
            next: (interfaces) => this.patchState({ interfaces }),
            error: (error: unknown) => this.errorHandler.showErrorModal(error),
            complete: () => this.patchState({ isLoading: false }),
          }),
        );
      }),
    );
  });
}
