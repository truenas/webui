import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { cloneDeep } from 'lodash';
import { Observable, tap } from 'rxjs';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';

export interface SlotConfig {
  slotIndex: number;
  category: WidgetCategory;
  type: WidgetType;
  settings: unknown;
}

export interface WidgetGroupFormState {
  layout: WidgetGroupLayout;
  slots: SlotConfig[];
}

const initialState: WidgetGroupFormState = {
  layout: null,
  slots: [],
};

@Injectable()
export class WidgetGroupFormStore extends ComponentStore<WidgetGroupFormState> {
  readonly layout$ = this.select((state) => state.layout);

  constructor() {
    super();
    this.initialize();
  }

  readonly initialize = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      tap(() => {
        this.setState({ ...initialState });
      }),
    );
  });

  readonly setLayout = this.updater((
    state: WidgetGroupFormState,
    layout: WidgetGroupLayout,
  ): WidgetGroupFormState => {
    const slots: SlotConfig[] = [];
    switch (layout) {
      case WidgetGroupLayout.Full:
        slots.push({
          slotIndex: 0, settings: {}, category: null, type: null,
        });
        break;
      case WidgetGroupLayout.HalfAndQuarters:
      case WidgetGroupLayout.QuartersAndHalf:
        for (let i = 0; i < 3; i++) {
          slots.push({
            slotIndex: i, settings: {}, category: null, type: null,
          });
        }
        break;
      case WidgetGroupLayout.Halves:
        for (let i = 0; i < 2; i++) {
          slots.push({
            slotIndex: i, settings: {}, category: null, type: null,
          });
        }
        break;
      case WidgetGroupLayout.Quarters:
        for (let i = 0; i < 4; i++) {
          slots.push({
            slotIndex: i, settings: {}, category: null, type: null,
          });
        }
        break;
    }
    return {
      layout,
      slots,
    };
  });

  readonly setCategory = this.updater((
    state: WidgetGroupFormState,
    {
      slotIndex,
      category,
    }: { slotIndex: number; category: WidgetCategory },
  ): WidgetGroupFormState => {
    const layout = state.layout;
    const slots: SlotConfig[] = [];
    for (const slot of state.slots) {
      const newSlot = cloneDeep(slot);
      if (newSlot.slotIndex === slotIndex) {
        newSlot.category = category;
      }
      slots.push(newSlot);
    }
    return {
      layout,
      slots,
    };
  });

  readonly setType = this.updater((
    state: WidgetGroupFormState,
    {
      slotIndex,
      type,
    }: { slotIndex: number; type: WidgetType },
  ): WidgetGroupFormState => {
    const layout = state.layout;
    const slots: SlotConfig[] = [];
    for (const slot of state.slots) {
      const newSlot = cloneDeep(slot);
      if (newSlot.slotIndex === slotIndex) {
        newSlot.type = type;
      }
      slots.push(newSlot);
    }

    return {
      layout,
      slots,
    };
  });

  readonly setSettings = this.updater((
    state: WidgetGroupFormState,
    {
      slotIndex,
      settings,
    }: { slotIndex: number; settings: unknown },
  ): WidgetGroupFormState => {
    const layout = state.layout;
    const slots: SlotConfig[] = [];
    for (const slot of state.slots) {
      const newSlot = cloneDeep(slot);
      if (newSlot.slotIndex === slotIndex) {
        newSlot.settings = cloneDeep(settings);
      }
      slots.push(newSlot);
    }

    return {
      layout,
      slots,
    };
  });

  getSlotConfig(slotIndex: number): SlotConfig {
    const slotConfig = this.state().slots.find((slot) => slot.slotIndex === slotIndex);
    return slotConfig ? cloneDeep(slotConfig) : null;
  }
}
