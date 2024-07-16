import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import { chain } from 'lodash';
import { switchMap, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureSlot, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  enclosures: DashboardEnclosure[];
  isLoading: boolean;
  selectedEnclosureIndex: number;
  selectedSlot: DashboardEnclosureSlot;
  selectedView: EnclosureView;
  selectedSide: EnclosureSide;
}

const initialState: EnclosureState = {
  isLoading: true,
  enclosures: [],
  selectedEnclosureIndex: 0,
  selectedSlot: undefined,
  selectedView: EnclosureView.Pools,
  selectedSide: undefined, // Undefined means front or top and will be picked in EnclosureSideComponent.
};

@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly stateAsSignal = toSignal(
    this.state$,
    { initialValue: initialState },
  );

  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly selectedSlot = computed(() => this.stateAsSignal().selectedSlot);
  readonly selectedEnclosure = computed(() => {
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
    const poolNames = chain(this.enclosures())
      .flatMap((enclosure) => Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]))
      .filter((slot) => Boolean(slot.pool_info?.pool_name))
      .map((slot) => slot.pool_info.pool_name)
      .uniq();

    return poolNames
      .map((poolName, index) => {
        return [poolName, this.theme.getRgbBackgroundColorByIndex(index)];
      })
      .fromPairs()
      .value();
  });

  readonly enclosureLabel = computed(() => getEnclosureLabel(this.selectedEnclosure()));

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private theme: ThemeService,
  ) {
    super(initialState);
  }

  initiate = this.effect((origin$) => {
    return origin$.pipe(
      tap(() => this.setState(initialState)),
      switchMap(() => {
        return this.ws.call('webui.enclosure.dashboard').pipe(
          tap((enclosures: DashboardEnclosure[]) => {
            this.patchState({ enclosures });
          }),
          this.errorHandler.catchError(),
          finalize(() => {
            this.patchState({ isLoading: false });
          }),
        );
      }),
    );
  });

  selectEnclosure = this.updater((state, id: string) => {
    const index = state.enclosures.findIndex((enclosure) => enclosure.id === id);

    if (index === state.selectedEnclosureIndex) {
      return state;
    }

    return {
      ...state,
      selectedEnclosureIndex: index,
      selectedSlot: undefined,
      selectedSide: undefined,
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

  selectSlot = this.updater((state, slot: DashboardEnclosureSlot) => {
    return {
      ...state,
      selectedSlot: slot,
    };
  });

  selectSlotByVdevDisk(vdevDisk: EnclosureVdevDisk): void {
    const enclosureToSelect = this.get().enclosures.find((enclosure) => enclosure.id === vdevDisk.enclosure_id);
    this.selectEnclosure(vdevDisk.enclosure_id);

    const selectedSlot = enclosureToSelect?.elements[EnclosureElementType.ArrayDeviceSlot][vdevDisk.slot];
    this.selectSlot(selectedSlot);
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
      selectedSlot: undefined,
    };
  });
}
