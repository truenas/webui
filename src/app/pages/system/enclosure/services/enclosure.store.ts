import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  enclosures: DashboardEnclosure[];
  selectedEnclosureIndex: number;
  selectedSlot: DashboardEnclosureSlot;
}

const initialState: EnclosureState = {
  enclosures: [],
  selectedEnclosureIndex: 0,
  selectedSlot: undefined,
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

    return {
      ...state,
      selectedEnclosureIndex: index,
      selectedSlot: undefined,
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
}
