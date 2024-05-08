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
  FormWidget,
  FormWidgetGroup,
  WidgetGroup,
  WidgetGroupLayout,
  formWidgetGroupToWidgetGroup,
  layoutToSlotSizes,
  widgetGroupIcons,
  widgetGroupToFormWidgetGroup,
} from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  protected group = signal<FormWidgetGroup>(
    { layout: WidgetGroupLayout.Full, slots: [{ category: null, type: null }] } as FormWidgetGroup,
  );
  protected selectedSlot = signal<WidgetGroupSlot<object>>({
    slotPosition: 0,
    slotSize: SlotSize.Full,
    category: null,
    type: null,
    settings: undefined,
  });

  validationErrors = signal([
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
  ]);

  form = this.fb.group({
    template: [''],
    layout: [WidgetGroupLayout.Full as WidgetGroupLayout, [Validators.required]],
  });

  settingsHasErrors = computed<boolean>(() => {
    const slotsCount = layoutToSlotSizes[this.group().layout].length;
    let hasEmptySlot = false;
    for (let i = 0; i < slotsCount; i++) {
      if (!this.group().slots[i]?.type) {
        hasEmptySlot = true;
        break;
      }
    }
    return hasEmptySlot || this.validationErrors().some((errors) => !!Object.keys(errors).length);
  });

  protected readonly layoutsMap = widgetGroupIcons;
  protected readonly widgetRegistry = widgetRegistry;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    protected chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.setupLayoutUpdates();
    this.setInitialFormValues();
  }

  setInitialFormValues(): void {
    const widgetGroup = this.chainedRef.getData();
    if (!widgetGroup) {
      this.group.set({ layout: WidgetGroupLayout.Full, slots: [{ category: null, type: null }] });
      return;
    }
    this.group.set(widgetGroupToFormWidgetGroup(widgetGroup));
    this.form.controls.layout.setValue(this.group().layout);
    for (let i = 0; i < this.group().slots.length; i++) {
      this.selectedSlotChanged(i);
    }
    this.selectedSlotChanged(SlotPosition.First);
  }

  setupLayoutUpdates(): void {
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group.update((group) => {
          const newGroup: FormWidgetGroup = {
            layout,
            slots: [],
          };
          for (let i = 0; i < layoutToSlotSizes[layout].length; i++) {
            let slotConfig: FormWidget = group.slots[i];
            if (!slotConfig) {
              slotConfig = { category: null, type: null };
            }
            newGroup.slots.push(slotConfig);
          }
          return newGroup;
        });
        if (this.selectedSlot().slotSize !== layoutToSlotSizes[layout][this.selectedSlot().slotPosition]) {
          this.selectedSlotChanged(this.selectedSlot().slotPosition);
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
    this.selectedSlot.update(() => {
      const group = this.group();
      return {
        slotPosition: slotIndex,
        category: group.slots[slotIndex].category,
        type: group.slots[slotIndex].type,
        settings: group.slots[slotIndex].settings,
        slotSize: layoutToSlotSizes[group.layout][slotIndex],
      } as WidgetGroupSlot<object>;
    });
  }

  onSubmit(): void {
    this.cleanWidgetGroup();
    if (this.settingsHasErrors()) {
      return;
    }
    this.chainedRef.close({
      response: formWidgetGroupToWidgetGroup(this.group()),
      error: false,
    });
  }

  cleanWidgetGroup(): void {
    this.group.update((group) => {
      const newGroup: FormWidgetGroup = { layout: group.layout, slots: [] };
      const slotSizes = layoutToSlotSizes[group.layout];
      for (let i = 0; i < layoutToSlotSizes[group.layout].length; i++) {
        if (widgetRegistry[group.slots[i].type].supportedSizes.includes(slotSizes[i])) {
          newGroup.slots.push(group.slots[i]);
        } else {
          newGroup.slots.push({ category: null, type: null });
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
      const newGroup: FormWidgetGroup = { layout: group.layout, slots: [] };
      for (let i = 0; i < layoutToSlotSizes[newGroup.layout].length; i++) {
        if (i as SlotPosition === slot.slotPosition) {
          newGroup.slots.push({
            category: slot.category,
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
