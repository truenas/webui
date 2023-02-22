import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { forkJoin, Observable, tap } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Disk, UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { DialogService, WebSocketService } from 'app/services';

export interface PoolManagerState {
  isLoading: boolean;

  unusedDisks: UnusedDisk[];
  enclosures: Enclosure[];
  formValue: PoolManagerWizardFormValue;
}

const initialState: PoolManagerState = {
  isLoading: false,

  unusedDisks: [],
  enclosures: [],
  formValue: null,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly formValue$ = this.select((state) => state.formValue);

  constructor(
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
            new EntityUtils().handleWsError(this, error, this.dialogService);
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
      switchMap((unusedDisks: UnusedDisk[]) => this.workAroundMissingField(unusedDisks)),
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

  /**
   * TODO: Remove after https://ixsystems.atlassian.net/browse/NAS-120360 is implemented.
   */
  private workAroundMissingField(unusedDisks: UnusedDisk[]): Observable<UnusedDisk[]> {
    return this.ws.call('disk.query').pipe(
      map((disks: Disk[]) => {
        return unusedDisks.map((unusedDisk) => {
          const diskWithEnclosure = disks.find((disk) => disk.name === unusedDisk.name);
          return {
            ...unusedDisk,
            enclosure: diskWithEnclosure.enclosure,
          };
        });
      }),
    );
  }
}
