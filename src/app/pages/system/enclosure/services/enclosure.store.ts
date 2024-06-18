import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  enclosures: DashboardEnclosure[];
  selectedEnclosureIndex: number;
  selectedSlot: DashboardEnclosureSlot;
  selectedView: EnclosureView;
  selectedSide: EnclosureSide;
}

const initialState: EnclosureState = {
  enclosures: [],
  selectedEnclosureIndex: 0,
  selectedSlot: undefined,
  selectedView: EnclosureView.Pools,
  selectedSide: undefined, // Undefined means front or top and will be picked in EnclosureSideComponent.
};

@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly selectedSlot = toSignal(
    this.state$.pipe(map((state) => state.selectedSlot)),
    { initialValue: initialState.selectedSlot },
  );
  readonly selectedEnclosure = toSignal(
    this.state$.pipe(map((state) => {
      return state.enclosures[state.selectedEnclosureIndex];
    })),
    { initialValue: undefined },
  );
  readonly selectedView = toSignal(
    this.state$.pipe(map((state) => state.selectedView)),
    { initialValue: initialState.selectedView },
  );
  readonly selectedSide = toSignal(
    this.state$.pipe(map((state) => state.selectedSide)),
    { initialValue: initialState.selectedSide },
  );

  readonly enclosures = toSignal(
    this.state$.pipe(map((state) => state.enclosures)),
    { initialValue: [] },
  );

  readonly enclosureLabel = computed(() => getEnclosureLabel(this.selectedEnclosure()));

  constructor(
    private ws: WebSocketService,
  ) {
    super(initialState);
  }

  getEnclosure(): Observable<DashboardEnclosure[]> {
    return this.ws.call('webui.enclosure.dashboard');
  }

  initiate = this.effect((origin$) => {
    return origin$.pipe(
      tap(() => this.setState(initialState)),
      switchMap(() => this.getEnclosure()),
      tap((enclosures: DashboardEnclosure[]) => {
        this.patchState({ enclosures });
      }),
      // TODO: Error handling
      // TODO: Loading indication
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
