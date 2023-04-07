import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import { forkJoin, Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { PoolManagerDisk } from 'app/classes/pool-manager-disk.class';
import { PoolManagerVdev } from 'app/classes/pool-manager-vdev.class';
import { Enclosure } from 'app/interfaces/enclosure.interface';
import { Option } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import {
  PoolManagerWizardFormValue,
} from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
import { DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface PoolManagerState {
  isLoading: boolean;

  allUnusedDisks: PoolManagerDisk[];
  unusedDisks: PoolManagerDisk[];
  enclosures: Enclosure[];
  vdevs: { data: PoolManagerVdev[] };
  formValue: PoolManagerWizardFormValue;
  dragActive: boolean;
  disksSelectedManually: boolean;
}

const initialState: PoolManagerState = {
  isLoading: false,
  allUnusedDisks: [],
  vdevs: { data: [] },
  unusedDisks: [],
  enclosures: [],
  dragActive: false,
  formValue: null,
  disksSelectedManually: false,
};

@Injectable()
export class PoolManagerStore extends ComponentStore<PoolManagerState> {
  readonly unusedDisks$ = this.select((state) => state.unusedDisks);
  readonly enclosures$ = this.select((state) => state.enclosures);
  readonly hasMultipleEnclosures$ = this.select((state) => state.enclosures.length > 1);
  readonly formValue$ = this.select((state) => state.formValue);
  readonly disksSelectedManually$ = this.select((state) => state.disksSelectedManually);
  readonly dataVdevs$ = this.select((state) => state.vdevs.data);

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private translate: TranslateService,
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
        this.patchState({
          allUnusedDisks: this.unusedDisksToManagerDisks(unusedDisks),
          unusedDisks: this.unusedDisksToManagerDisks(unusedDisks),
        });
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

  createDataVdevsAutomatically = this.updater((
    state: PoolManagerState,
    {
      width, count, size, type,
    }: { width: number; count: number; size: number; type: string },
  ) => {
    const dataVdevs: PoolManagerVdev[] = [];
    let unusedDisks = state.allUnusedDisks;
    if (!width || !count || !size || !type) {
      return {
        ...state,
      };
    }
    for (let i = 0; i < count; i++) {
      const dataVdev: PoolManagerVdev = new PoolManagerVdev(type, 'data');
      for (const disk of unusedDisks) {
        if (disk.size === size) {
          dataVdev.disks.push({ ...disk, vdevUuid: dataVdev.uuid });
          unusedDisks = unusedDisks.filter((unusedDisk) => unusedDisk.identifier !== disk.identifier);
          if (dataVdev.disks.length >= width) {
            break;
          }
        }
      }
      if (dataVdev.disks.length) {
        dataVdevs.push(dataVdev);
      }
    }

    return {
      ...state,
      vdevs: { ...state.vdevs, data: dataVdevs },
      unusedDisks,
    };
  });

  private unusedDisksToManagerDisks(unusedDisks: UnusedDisk[]): PoolManagerDisk[] {
    return unusedDisks.map((disk) => {
      const details: Option[] = [];
      if (disk.rotationrate) {
        details.push({ label: this.translate.instant('Rotation Rate'), value: disk.rotationrate });
      }
      details.push({ label: this.translate.instant('Model'), value: disk.model });
      details.push({ label: this.translate.instant('Serial'), value: disk.serial });
      if (disk.enclosure) {
        details.push({ label: this.translate.instant('Enclosure'), value: disk.enclosure.number });
      }
      return {
        ...disk,
        details,
        real_capacity: disk.size,
        capacity: filesize(disk.size, { standard: 'iec' }),
      } as PoolManagerDisk;
    });
  }

  resetLayout = this.updater((state) => {
    return {
      ...state,
      vdevs: { data: [] },
      unusedDisks: [...state.allUnusedDisks],
      disksSelectedManually: false,
    };
  });
}
