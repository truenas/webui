import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable, switchMap, tap } from 'rxjs';
import { EnclosureUi, EnclosureUiSlot } from 'app/interfaces/enclosure.interface';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  enclosure: EnclosureUi[];
  selectedDisk: EnclosureUiSlot;
}

const initialState: EnclosureState = {
  enclosure: undefined,
  selectedDisk: undefined,
};

@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  constructor(
    private ws: WebSocketService,
  ) {
    super();
  }

  getEnclosure(): Observable<EnclosureUi[]> {
    return this.ws.call('webui.enclosure.dashboard');
  }

  initiate = this.effect((origin$) => {
    return origin$.pipe(
      tap(() => this.setState(initialState)),
      switchMap(() => this.getEnclosure()),
      tap((enclosures: EnclosureUi[]) => {
        this.setState((state) => {
          return {
            ...state,
            enclosure: enclosures,
          };
        });
      }),
    );
  });

  selectDisk = this.updater((state, diskName: string) => {
    const slots = Object.values(state.enclosure[0]?.elements['Array Device Slot']);

    return {
      ...state,
      selectedDisk: slots.find((slot) => slot.name === diskName),
    };
  });
}
