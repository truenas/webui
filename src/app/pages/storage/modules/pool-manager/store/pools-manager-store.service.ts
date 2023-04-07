import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { forkJoin, Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';
import {
  PoolManagerWizardFormValue,
} from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export type VdevManagerDisk = ManagerDisk & { vdevUuid: string };

export interface PoolManagerState {
  isLoading: boolean;

  unusedDisks: UnusedDisk[];
  enclosures: Enclosure[];
  vdevs: { data: ManagerVdev[] };
  formValue: PoolManagerWizardFormValue;
  dragActive: boolean;
}

const initialState: PoolManagerState = {
  isLoading: false,
  vdevs: { data: [] },
  unusedDisks: [],
  enclosures: [],
  dragActive: false,
  formValue: null,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly formValue$ = this.select((state) => state.formValue);

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          isLoading: true,
        });
      }),
      switchMap(() => {
        return forkJoin([
          this.loadUnusedDisks(),
          this.loadEnclosures(),
        ]).pipe(
          tapResponse(() => {
            this.patchState({
              isLoading: false,
            });
          },
          (error: WebsocketError) => {
            this.patchState({
              isLoading: false,
            });
            this.dialogService.error(this.errorHandler.parseWsError(error));
          }),
        );
      }),
    );
  });

  updateFormValue = this.updater((state: PoolManagerState, updatedFormValue: PoolManagerWizardFormValue) => {
    return {
      ...state,
      formValue: updatedFormValue,
    };
  });

  private loadUnusedDisks(): Observable<UnusedDisk[]> {
    return this.ws.call('disk.get_unused').pipe(
      tap((unusedDisks) => {
        this.patchState({ unusedDisks });
      }),
    );
  }

  private loadEnclosures(): Observable<Enclosure[]> {
    return this.ws.call('enclosure.query').pipe(
      tap((enclosures) => {
        this.patchState({ enclosures });
      }),
    );
  }
}
