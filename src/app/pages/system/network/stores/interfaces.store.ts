import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

export interface InterfacesState {
  interfaces: NetworkInterface[];
  isLoading: boolean;
  isHaEnabled: boolean;
  isHaLicensed: boolean;
}

const initialState: InterfacesState = {
  interfaces: [],
  isLoading: false,
  isHaEnabled: false,
  isHaLicensed: false,
};

@Injectable()
export class InterfacesStore extends ComponentStore<InterfacesState> {
  readonly isHaEnabled = computed(() => this.state().isHaEnabled);
  readonly isHaLicensed = computed(() => this.state().isHaLicensed);
  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private store$: Store,
  ) {
    super(initialState);
    this.initialize();
  }

  initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => combineLatest([
        this.store$.select(selectIsHaLicensed) as Observable<boolean>,
        this.store$.select(selectHaStatus).pipe(filter(Boolean)) as Observable<HaStatus>,
      ]) as Observable<[boolean, HaStatus]>),
      tap(([isHa, { hasHa }]: [boolean, HaStatus]) => {
        this.patchState({
          isHaEnabled: isHa && hasHa,
          isHaLicensed: isHa,
        });
      }),
    );
  });

  readonly loadInterfaces = this.effect((trigger$) => {
    return trigger$.pipe(
      tap(() => this.patchState({ isLoading: true })),
      switchMap(() => {
        return this.api.call('interface.query').pipe(
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
