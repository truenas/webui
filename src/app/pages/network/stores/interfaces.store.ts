import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs/operators';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

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
  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly loadInterfaces = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() => {
        return this.ws.call('interface.query').pipe(
          tap({
            next: (interfaces) => this.patchState({ interfaces }),
            error: (error) => this.dialogService.error(this.errorHandler.parseWsError(error)),
            complete: () => this.patchState({ isLoading: false }),
          }),
        );
      }),
    );
  });
}
