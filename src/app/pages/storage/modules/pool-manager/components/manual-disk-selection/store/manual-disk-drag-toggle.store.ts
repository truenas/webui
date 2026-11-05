import { Injectable } from '@angular/core';
import { patchState, signalState } from '@ngrx/signals';

export interface ManualDiskDragToggleState {
  dragActive: boolean;
}

const initialState: ManualDiskDragToggleState = {
  dragActive: false,
};

@Injectable()
export class ManualDiskDragToggleStore {
  private readonly state = signalState(initialState);

  readonly dragActive = this.state.dragActive;

  toggleActivateDrag(dragActive: boolean): void {
    patchState(this.state, { dragActive });
  }
}
