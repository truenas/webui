import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { produce } from 'immer';
import {
  filter, flatMap, fromPairs, map, uniq,
} from 'lodash-es';
import { Observable, switchMap, tap } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';
import { EnclosureElementType, DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { getDefaultSide } from 'app/pages/system/enclosure/utils/get-default-side.utils';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface EnclosureState {
  enclosures: DashboardEnclosure[];
  isLoading: boolean;
  selectedEnclosureIndex: number;
  selectedSlotNumber: number | null;
  selectedView: EnclosureView;
  selectedSide: EnclosureSide | undefined;
}

const initialState: EnclosureState = {
  isLoading: true,
  enclosures: [],
  selectedEnclosureIndex: 0,
  selectedSlotNumber: null,
  selectedView: EnclosureView.Pools,
  selectedSide: undefined,
};

@UntilDestroy()
@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly stateAsSignal = toSignal(
    this.state$,
    { initialValue: initialState },
  );

  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly selectedSlot = computed(() => {
    const selectedSlotNumber = this.stateAsSignal().selectedSlotNumber;
    const selectedEnclosure = this.selectedEnclosure();
    if (selectedSlotNumber === null || !selectedEnclosure) {
      return null;
    }

    const elements = selectedEnclosure.elements[EnclosureElementType.ArrayDeviceSlot];
    return elements[selectedSlotNumber];
  });

  readonly selectedEnclosure = computed<DashboardEnclosure | undefined>(() => {
    const state = this.stateAsSignal();
    return state.enclosures[state.selectedEnclosureIndex];
  });

  readonly selectedEnclosureSlots = computed(() => {
    const slots = this.selectedEnclosure()?.elements?.[EnclosureElementType.ArrayDeviceSlot] || {};
    return Object.values(slots);
  });

  readonly selectedView = computed(() => this.stateAsSignal().selectedView);
  readonly selectedSide = computed(() => this.stateAsSignal().selectedSide);
  readonly enclosures = computed(() => this.stateAsSignal().enclosures);

  readonly poolColors = computed<Record<string, string>>(() => {
    const enclosures = this.enclosures();
    const extractedEnclosuresObjects = flatMap(
      enclosures,
      (enclosure) => Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]),
    );
    const enclosuresWithPools = filter(
      extractedEnclosuresObjects,
      (slot) => Boolean(slot.pool_info?.pool_name),
    );
    const poolNames = map(enclosuresWithPools, (slot) => slot.pool_info.pool_name);
    const uniqPoolNames = uniq(poolNames);
    const poolNamesWithColorsByIndex = map(uniqPoolNames, (poolName, index) => {
      return [poolName, this.theme.getRgbBackgroundColorByIndex(index)];
    });

    return fromPairs(poolNamesWithColorsByIndex);
  });

  readonly enclosureLabel = computed(() => getEnclosureLabel(this.selectedEnclosure()));

  readonly hasMoreThanOneSide = computed(() => {
    return [
      this.selectedEnclosure()?.front_loaded,
      this.selectedEnclosure()?.top_loaded,
      Number(this.selectedEnclosure()?.rear_slots) > 0,
      Number(this.selectedEnclosure()?.internal_slots) > 0,
    ].filter(Boolean).length > 1;
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private theme: ThemeService,
  ) {
    super(initialState);
  }

  initiate = this.effect((origin$) => {
    return origin$.pipe(
      tap(() => this.setState(initialState)),
      switchMap(() => {
        return this.api.call('webui.enclosure.dashboard').pipe(
          tap((enclosures: DashboardEnclosure[]) => {
            this.patchState((state) => {
              return {
                enclosures,
                selectedSide: getDefaultSide(enclosures[state.selectedEnclosureIndex]),
              };
            });
          }),
          this.errorHandler.catchError(),
          finalize(() => {
            this.patchState({ isLoading: false });
          }),
        );
      }),
    );
  });

  update = this.effect((origin$) => {
    return origin$.pipe(
      switchMap(() => {
        return this.api.call('webui.enclosure.dashboard').pipe(
          tap((enclosures: DashboardEnclosure[]) => {
            this.patchState({ enclosures });
          }),
          this.errorHandler.catchError(),
        );
      }),
    );
  });

  listenForDiskUpdates(): Observable<unknown> {
    return this.api.subscribe('disk.query').pipe(
      debounceTime(1 * 1000),
      tap(() => this.update()),
    );
  }

  selectEnclosure = this.updater((state, id: string) => {
    let index = state.enclosures.findIndex((enclosure) => enclosure.id === id);

    if (index === -1) {
      // This could happen if user navigates to a non-existent enclosure via URL.
      index = 0;
    }

    if (index === state.selectedEnclosureIndex) {
      return state;
    }

    return {
      ...state,
      selectedEnclosureIndex: index,
      selectedSlotNumber: null,
      selectedSide: getDefaultSide(state.enclosures[index]),
      selectedView: EnclosureView.Pools,
    };
  });

  renameSelectedEnclosure = this.updater((state, label: string) => {
    const enclosures = [...state.enclosures];
    enclosures[state.selectedEnclosureIndex] = {
      ...enclosures[state.selectedEnclosureIndex],
      label,
    };

    return {
      ...state,
      enclosures,
    };
  });

  selectSlot = this.updater((state, slotNumber: number | null) => {
    return {
      ...state,
      selectedSlotNumber: slotNumber,
    };
  });

  selectSlotByVdevDisk(vdevDisk: EnclosureVdevDisk): void {
    this.selectEnclosure(vdevDisk.enclosure_id);
    this.selectSlot(vdevDisk.slot);
  }

  selectView = this.updater((state, view: EnclosureView) => {
    return {
      ...state,
      selectedView: view,
    };
  });

  selectSide = this.updater((state, side: EnclosureSide) => {
    if (side === state.selectedSide) {
      return state;
    }

    return {
      ...state,
      selectedSide: side,
      selectedSlotNumber: null,
    };
  });

  changeLightStatus = this.updater((state, options: {
    enclosureId: string;
    driveBayNumber: number;
    status: DriveBayLightStatus;
  }) => {
    return produce(state, (draft) => {
      const enclosureToUpdate = draft.enclosures.find((enclosure) => enclosure.id === options.enclosureId);
      if (!enclosureToUpdate) {
        return;
      }

      const driveBay = enclosureToUpdate.elements[EnclosureElementType.ArrayDeviceSlot][options.driveBayNumber];
      driveBay.drive_bay_light_status = options.status;
    });
  });
}
