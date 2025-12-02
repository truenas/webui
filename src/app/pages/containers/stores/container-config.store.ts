import { computed, DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import {
  of, switchMap, tap,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
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
export class ContainerConfigStore extends ComponentStore<ContainerConfigState> {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  readonly isLoading = computed(() => this.state().isLoading);
  readonly config = computed(() => this.state().config);

  constructor() {
    super(initialState);
    this.subscribeToConfigUpdates();
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
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
    this.api.subscribe('lxc.config')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ fields }) => {
        this.patchState({ config: fields });
      });
  }
}
