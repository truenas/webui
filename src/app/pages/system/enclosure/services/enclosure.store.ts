import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
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
  readonly selectedSlot$ = this.state$.pipe(map((state) => state.selectedSlot));
  readonly selectedEnclosure$ = this.state$.pipe(map((state) => {
    return state.enclosures[state.selectedEnclosureIndex];
  }));

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

  selectEnclosure = this.updater((state, index: number) => {
    return {
      ...state,
      selectedEnclosureIndex: index,
      selectedSlot: undefined,
    };
  });

  selectSlot = this.updater((state, slot: DashboardEnclosureSlot) => {
    return {
      ...state,
      selectedSlot: slot,
    };
  });
}
