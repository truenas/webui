import { computed, Injectable, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { produce } from 'immer';
import {
  filter, flatMap, fromPairs, map, uniq,
} from 'lodash-es';
import {
  Observable, pipe, switchMap, tap,
} from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { EnclosureElementType, DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { ThemeService } from 'app/modules/theme/theme.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { getDefaultSide } from 'app/pages/system/enclosure/utils/get-default-side.utils';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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

@Injectable()
export class EnclosureStore {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private theme = inject(ThemeService);

  private readonly state = signalState(initialState);

  readonly isLoading = this.state.isLoading;
  readonly selectedView = this.state.selectedView;
  readonly selectedSide = this.state.selectedSide;
  readonly enclosures = this.state.enclosures;

  readonly selectedSlot = computed(() => {
    const selectedSlotNumber = this.state.selectedSlotNumber();
    const selectedEnclosure = this.selectedEnclosure();
    if (selectedSlotNumber === null || !selectedEnclosure) {
      return null;
    }

    const elements = selectedEnclosure.elements[EnclosureElementType.ArrayDeviceSlot];
    return elements[selectedSlotNumber];
  });

  readonly selectedEnclosure = computed<DashboardEnclosure | undefined>(() => {
    return this.state.enclosures()[this.state.selectedEnclosureIndex()];
  });

  readonly selectedEnclosureSlots = computed(() => {
    const slots = this.selectedEnclosure()?.elements?.[EnclosureElementType.ArrayDeviceSlot] || {};
    return Object.values(slots);
  });

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
    const poolNames = map(enclosuresWithPools, (slot) => slot.pool_info?.pool_name);
    const uniqPoolNames = uniq(poolNames);
    const poolNamesWithColorsByIndex = map(uniqPoolNames, (poolName, index) => {
      return [poolName, this.theme.getRgbBackgroundColorByIndex(index)];
    });

    return fromPairs(poolNamesWithColorsByIndex);
  });

  readonly enclosureLabel = computed(() => {
    const enclosure = this.selectedEnclosure();
    if (!enclosure) {
      return '';
    }

    return getEnclosureLabel(enclosure);
  });

  readonly hasMoreThanOneSide = computed(() => {
    return [
      this.selectedEnclosure()?.front_loaded,
      this.selectedEnclosure()?.top_loaded,
      Number(this.selectedEnclosure()?.rear_slots) > 0,
      Number(this.selectedEnclosure()?.internal_slots) > 0,
    ].filter(Boolean).length > 1;
  });

  readonly initiate = rxMethod<void>(pipe(
    tap(() => patchState(this.state, initialState)),
    switchMap(() => this.api.call('webui.enclosure.dashboard').pipe(
      tapResponse({
        next: (enclosures: DashboardEnclosure[]) => {
          patchState(this.state, (state) => ({
            enclosures,
            selectedSide: getDefaultSide(enclosures[state.selectedEnclosureIndex]),
            isLoading: false,
          }));
        },
        error: (error: unknown) => {
          patchState(this.state, { isLoading: false });
          this.errorHandler.showErrorModal(error);
        },
      }),
    )),
  ));

  readonly update = rxMethod<void>(pipe(
    switchMap(() => this.api.call('webui.enclosure.dashboard').pipe(
      tapResponse({
        next: (enclosures: DashboardEnclosure[]) => patchState(this.state, { enclosures }),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      }),
    )),
  ));

  listenForDiskUpdates(): Observable<unknown> {
    return this.api.subscribe('disk.query').pipe(
      debounceTime(1 * 1000),
      tap(() => this.update()),
    );
  }

  selectEnclosure(id: string): void {
    patchState(this.state, (state) => {
      let index = state.enclosures.findIndex((enclosure) => enclosure.id === id);

      if (index === -1) {
        // This could happen if user navigates to a non-existent enclosure via URL.
        index = 0;
      }

      if (index === state.selectedEnclosureIndex) {
        return {};
      }

      return {
        selectedEnclosureIndex: index,
        selectedSlotNumber: null,
        selectedSide: getDefaultSide(state.enclosures[index]),
        selectedView: EnclosureView.Pools,
      };
    });
  }

  renameSelectedEnclosure(label: string): void {
    patchState(this.state, (state) => {
      const enclosures = [...state.enclosures];
      enclosures[state.selectedEnclosureIndex] = {
        ...enclosures[state.selectedEnclosureIndex],
        label,
      };

      return { enclosures };
    });
  }

  selectSlot(slotNumber: number | null): void {
    patchState(this.state, { selectedSlotNumber: slotNumber });
  }

  selectSlotByVdevDisk(vdevDisk: EnclosureVdevDisk): void {
    this.selectEnclosure(vdevDisk.enclosure_id);
    this.selectSlot(vdevDisk.slot);
  }

  selectView(view: EnclosureView): void {
    patchState(this.state, { selectedView: view });
  }

  selectSide(side: EnclosureSide): void {
    patchState(this.state, (state) => {
      if (side === state.selectedSide) {
        return {};
      }

      return { selectedSide: side, selectedSlotNumber: null };
    });
  }

  changeLightStatus(options: {
    enclosureId: string;
    driveBayNumber: number;
    status: DriveBayLightStatus;
  }): void {
    patchState(this.state, (state) => ({
      enclosures: produce(state.enclosures, (draft) => {
        const enclosureToUpdate = draft.find((enclosure) => enclosure.id === options.enclosureId);
        if (!enclosureToUpdate) {
          return;
        }

        const driveBay = enclosureToUpdate.elements[EnclosureElementType.ArrayDeviceSlot][options.driveBayNumber];
        driveBay.drive_bay_light_status = options.status;
      }),
    }));
  }
}
