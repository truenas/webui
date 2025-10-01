import { computed, Injectable, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import {
  of, Subscription, switchMap, tap,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface VirtualizationConfigState {
  isLoading: boolean;
  config: VirtualizationGlobalConfig | null;
}

const initialState: VirtualizationConfigState = {
  isLoading: false,
  config: null,
};

@UntilDestroy()
@Injectable()
export class VirtualizationConfigStore extends ComponentStore<VirtualizationConfigState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly config = computed(() => this.state().config);

  private configSubscription: Subscription;

  constructor() {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.subscribeToConfigUpdates();

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

  private subscribeToConfigUpdates(): void {
    if (this.configSubscription) {
      return;
    }

    this.configSubscription = this.api.subscribe('lxc.config')
      .pipe(untilDestroyed(this))
      .subscribe(({ fields }) => {
        this.patchState({ config: fields });
      });
  }
}
