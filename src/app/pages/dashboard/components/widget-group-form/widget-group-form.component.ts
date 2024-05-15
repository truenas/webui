import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, signal,
} from '@angular/core';
import {
  FormBuilder, ValidationErrors, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, tap } from 'rxjs';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetGroupSlot } from 'app/pages/dashboard/types/widget-group-slot.interface';
import {
  WidgetGroup,
  WidgetGroupLayout,
  layoutToSlotSizes,
  widgetGroupIcons,
} from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize, Widget } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  protected group = signal<WidgetGroup>(
    { layout: WidgetGroupLayout.Full, slots: [{ type: null }] } as WidgetGroup,
  );
  selectedSlot = signal<WidgetGroupSlot<object>>({
    slotPosition: 0,
    slotSize: SlotSize.Full,
    type: null,
    settings: undefined,
  });

  protected validationErrors = signal([
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
  ]);

  protected form = this.fb.group({
    template: [''],
    layout: [WidgetGroupLayout.Full as WidgetGroupLayout, [Validators.required]],
  });

  protected settingsHasErrors = computed<boolean>(() => {
    const validationErrors = this.validationErrors().slice(0, layoutToSlotSizes[this.group().layout].length);
    return validationErrors.some((errors) => !!Object.keys(errors).length);
  });

  protected readonly layoutsMap = widgetGroupIcons;

  // TODO: Implement template options
  protected templateOptions$ = of([]);

  constructor(
    protected chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.setupLayoutUpdates();
    this.setInitialFormValues();
  }

  private setInitialFormValues(): void {
    const widgetGroup = this.chainedRef.getData();
    if (!widgetGroup) {
      this.group.set({ layout: WidgetGroupLayout.Full, slots: [{ type: null }] });
      return;
    }
    this.group.set(widgetGroup);
    this.form.controls.layout.setValue(this.group().layout);
    for (let slotPosition = 0; slotPosition < this.group().slots.length; slotPosition++) {
      this.updateSelectedSlot(slotPosition);
    }
    this.updateSelectedSlot(SlotPosition.First);
  }

  private setupLayoutUpdates(): void {
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group.update((group) => {
          const newGroup: WidgetGroup = { layout, slots: [] };
          const slotsCount = Math.max(layoutToSlotSizes[layout].length, group.slots.length);
          for (let i = 0; i < slotsCount; i++) {
            let slotConfig: Widget = group.slots[i];
            if (!slotConfig) {
              slotConfig = { type: null };
            }
            newGroup.slots.push(slotConfig);
          }
          return newGroup;
        });
        if (this.selectedSlot().slotSize !== layoutToSlotSizes[layout][this.selectedSlot().slotPosition]) {
          this.selectedSlotChanged(0);
        }
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  selectedSlotChanged(slotIndex: SlotPosition): void {
    if (
      slotIndex === this.selectedSlot().slotPosition
      && this.selectedSlot().slotSize === layoutToSlotSizes[this.group().layout][slotIndex]
    ) {
      return;
    }
    this.updateSelectedSlot(slotIndex);
  }

  updateSelectedSlot(slotPosition: SlotPosition): void {
    this.selectedSlot.update(() => {
      const group = this.group();
      return {
        slotPosition,
        type: group.slots[slotPosition].type,
        settings: group.slots[slotPosition].settings,
        slotSize: layoutToSlotSizes[group.layout][slotPosition],
      } as WidgetGroupSlot<object>;
    });
  }

  protected onSubmit(): void {
    this.cleanWidgetGroup();
    if (this.settingsHasErrors()) {
      return;
    }
    this.chainedRef.close({
      response: this.group(),
      error: false,
    });
  }

  private cleanWidgetGroup(): void {
    this.group.update((group) => {
      const newGroup: WidgetGroup = { layout: group.layout, slots: [] };
      const slotSizes = layoutToSlotSizes[group.layout];
      for (let i = 0; i < slotSizes.length; i++) {
        if (widgetRegistry[group.slots[i].type]?.supportedSizes.includes(slotSizes[i])) {
          newGroup.slots.push(group.slots[i]);
        } else {
          newGroup.slots.push({ type: null });
        }
      }
      return newGroup;
    });
  }

  updateSlotValidation([slotPosition, errors]: [SlotPosition, ValidationErrors]): void {
    this.validationErrors.update((validaitonErrors) => {
      const newErrors = [...validaitonErrors];
      newErrors[slotPosition] = errors;
      return newErrors;
    });
  }

  updateSlotSettings(slot: WidgetGroupSlot<object>): void {
    this.group.update((group) => {
      const newGroup: WidgetGroup = { layout: group.layout, slots: [] };
      const slotsCount = Math.max(layoutToSlotSizes[newGroup.layout].length, group.slots.length);
      for (let i = 0; i < slotsCount; i++) {
        if (i as SlotPosition === slot.slotPosition) {
          newGroup.slots.push({
            type: slot.type,
            settings: slot.settings || undefined,
          });
        } else {
          newGroup.slots.push(group.slots[i]);
        }
      }
      return newGroup;
    });
  }
}
