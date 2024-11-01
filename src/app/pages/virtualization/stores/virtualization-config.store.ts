import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Subscription, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { VirtualizationGlobalConfig } from 'app/interfaces/virtualization.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface VirtualizationConfigState {
  isLoading: boolean;
  config: VirtualizationGlobalConfig;
}

const initialState: VirtualizationConfigState = {
  isLoading: false,
  config: null,
};

@UntilDestroy()
@Injectable()
export class VirtualizationConfigStore extends ComponentStore<VirtualizationConfigState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly config = computed(() => this.stateAsSignal().config);
  readonly virtualizationState = computed(() => this.config()?.state);

  private configSubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.subscribeToConfigUpdates();

        this.patchState({ isLoading: true });

        return this.ws.call('virt.global.config').pipe(
          tap((config) => {
            this.patchState({
              config,
              isLoading: false,
            });
          }),
          catchError((error) => {
            this.patchState({ isLoading: false });
            this.errorHandler.showErrorModal(error);
            return undefined;
          }),
        );
      }),
    );
  });

  private subscribeToConfigUpdates(): void {
    if (this.configSubscription) {
      return;
    }

    this.configSubscription = this.ws.subscribe('virt.global.config')
      .pipe(untilDestroyed(this))
      .subscribe(({ fields }) => {
        this.patchState({ config: fields });
      });
  }
}
