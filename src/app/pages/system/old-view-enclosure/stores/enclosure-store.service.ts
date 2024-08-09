import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';
import {
  forkJoin, Observable, tap,
} from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  areEnclosuresLoading: boolean;
  areDisksLoading: boolean;
  enclosures: OldEnclosure[];
  selectedEnclosure?: string | null;
  selectedEnclosureDisks?: DashboardEnclosureSlot[] | null;
}

const initialState: EnclosureState = {
  areEnclosuresLoading: false,
  areDisksLoading: false,
  enclosures: [],
  selectedEnclosure: null,
  selectedEnclosureDisks: [],
};

@UntilDestroy()
@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly data$ = this.select((state) => state);
  readonly enclosureViews$ = this.select((state) => state.enclosures);

  constructor(
    private ws: WebSocketService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
    this.listenForDiskUpdates();
  }

  readonly loadData = this.effect((triggers$: Observable<void>) => {
    return triggers$.pipe(
      tap(() => {
        this.patchState({
          ...initialState,
          areEnclosuresLoading: true,
          areDisksLoading: true,
        });
      }),
      switchMap(() => this.updateState()),
    );
  });

  updateState(): Observable<{
    enclosures: OldEnclosure[];
  }> {
    return forkJoin({
      enclosures: this.getEnclosures().pipe(
        this.patchStateWithEnclosureData(),
      ),
    });
  }

  getEnclosures(): Observable<OldEnclosure[]> {
    return this.ws.call('webui.enclosure.dashboard').pipe(
      map((enclosure) => this.addEnclosureNumber(enclosure)),
    );
  }

  patchStateWithEnclosureData(): (source: Observable<OldEnclosure[]>) => Observable<OldEnclosure[]> {
    return tapResponse(
      (enclosures) => {
        const selectedEnclosure = enclosures.length ? enclosures[0].id : null;
        this.patchState({
          areEnclosuresLoading: false,
          enclosures: [...enclosures],
          selectedEnclosure,
        });
      },
      (error: unknown) => {
        this.patchState({
          areEnclosuresLoading: false,
        });
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    );
  }

  addEnclosureNumber(enclosures: DashboardEnclosure[]): OldEnclosure[] {
    return enclosures.map((enclosure, index) => {
      return {
        ...enclosure,
        number: index,
      };
    });
  }

  updateLabel(enclosureId: string, label: string): void {
    this.patchState((state) => {
      return {
        ...state,
        enclosures: state.enclosures.map((enclosure) => {
          if (enclosure.id !== enclosureId) {
            return enclosure;
          }

          return {
            ...enclosure,
            label,
          };
        }),
      };
    });
  }

  getPools(enclosure: OldEnclosure): string[] {
    if (!enclosure) return [];
    const pools = Object.entries(enclosure?.elements['Array Device Slot'])
      .filter((entry) => entry[1].pool_info !== null)
      .map((keyValue) => (keyValue[1]).pool_info?.pool_name);
    const uniquePools = new Set(pools);
    return Array.from(uniquePools);
  }

  listenForDiskUpdates(): void {
    this.ws.subscribe('disk.query')
      .pipe(
        filter((event) => [
          IncomingApiMessageType.Added,
          IncomingApiMessageType.Changed,
          IncomingApiMessageType.Removed,
        ].includes(event.msg)),
        untilDestroyed(this),
      )
      .subscribe(() => this.loadData());
  }

  updateSelectedEnclosureDisks(selectedEnclosure: OldEnclosure): void {
    const disks = Object.entries(selectedEnclosure.elements['Array Device Slot'])
      .map((keyValue) => keyValue[1]);

    this.updateStateWithSelectedEnclosureDisks(disks);
  }

  readonly updateStateWithSelectedEnclosureDisks = this.updater(
    (state, selectedEnclosureDisks: DashboardEnclosureSlot[]) => {
      return {
        ...state,
        selectedEnclosureDisks,
      };
    },
  );

  readonly updateSelectedEnclosure = this.updater((state, selectedEnclosure: string) => {
    const selected = state.enclosures.find((enclosure) => enclosure.id === selectedEnclosure);
    this.updateSelectedEnclosureDisks(selected);
    return {
      ...state,
      selectedEnclosure,
    };
  });
}
