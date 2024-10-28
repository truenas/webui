import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, signal,
} from '@angular/core';
import {
  FormControl, ValidationErrors, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxIconGroupComponent } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
import { WidgetEditorGroupComponent } from './widget-editor-group/widget-editor-group.component';
import { WidgetGroupSlotFormComponent } from './widget-group-slot-form/widget-group-slot-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeader2Component,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxIconGroupComponent,
    WidgetEditorGroupComponent,
    WidgetGroupSlotFormComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class WidgetGroupFormComponent {
  protected group = signal<WidgetGroup>(
    { layout: WidgetGroupLayout.Full, slots: [{ type: null }] },
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

  protected layoutControl = new FormControl(WidgetGroupLayout.Full, [Validators.required]);
  protected readonly layoutOptions = widgetGroupIcons;

  protected settingsHasErrors = computed<boolean>(() => {
    const validationErrors = this.validationErrors().slice(0, layoutToSlotSizes[this.group().layout].length);
    return validationErrors.some((errors) => !!Object.keys(errors).length);
  });

  constructor(
    protected chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
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
    this.layoutControl.setValue(this.group().layout);
    for (let slotPosition = 0; slotPosition < this.group().slots.length; slotPosition++) {
      this.updateSelectedSlot(slotPosition);
    }
    this.updateSelectedSlot(SlotPosition.First);
  }

  private setupLayoutUpdates(): void {
    this.layoutControl.valueChanges.pipe(
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
        const slotPosition = i as SlotPosition;
        if (slotPosition === slot.slotPosition) {
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
