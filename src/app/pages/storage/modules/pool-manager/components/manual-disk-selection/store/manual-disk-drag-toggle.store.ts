import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

export interface ManualDiskDragToggleState {
  dragActive: boolean;
}

const initialState: ManualDiskDragToggleState = {
  dragActive: false,
};

@Injectable()
export class ManualDiskDragToggleStore extends ComponentStore<ManualDiskDragToggleState> {
  readonly dragActive$ = this.select((state) => state.dragActive);

  constructor() {
    super(initialState);
  }

  toggleActivateDrag = this.updater((state: ManualDiskDragToggleState, activateDrag: boolean) => {
    return {
      dragActive: activateDrag,
    };
  });
}
