import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, of, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import {
  WidgetGroup, WidgetGroupLayout, layoutToSlotSizes, widgetGroupIcons,
} from 'app/pages/dashboard/types/widget-group.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent {
  protected group: WidgetGroup;
  protected selectedSlot = 0;
  protected form = this.formBuilder.group({
    template: [''],
    layout: [WidgetGroupLayout.Full],
    category: [null as WidgetCategory],
  });
  readonly layoutsMap = widgetGroupIcons;

  widgetCategoriesOptions: Observable<Option[]>;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    private formBuilder: FormBuilder,
    private chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
  ) {
    this.setCategoryOptions();
    this.setInitialFormValues();
  }

  setInitialFormValues(): void {
    this.group = this.chainedRef.getData();
    this.form.controls.layout.setValue(this.group.layout);
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group = { ...this.group, layout };
        this.setCategoryOptions();
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  selectedSlotChanged(slotIndex: number): void {
    this.selectedSlot = slotIndex;
    this.setCategoryOptions();
  }

  setCategoryOptions(): void {
    const categoryLabels = (Object.keys(WidgetCategory) as (keyof typeof WidgetCategory)[]);
    const sizeSuitedCategoryLabels = categoryLabels.filter(
      (key: keyof typeof WidgetCategory) => {
        const widgetNames = Object.keys(widgetRegistry) as (keyof typeof widgetRegistry)[];
        return widgetNames.some((widgetName) => {
          if (widgetRegistry[widgetName].category !== WidgetCategory[key]) {
            return false;
          }
          const layout = this.form.controls.layout.value;
          const slotIndex = this.selectedSlot;
          const slotSize = layoutToSlotSizes[layout][slotIndex];
          return widgetRegistry[widgetName].supportedSizes.includes(slotSize);
        });
      },
    );
    this.widgetCategoriesOptions = of(
      sizeSuitedCategoryLabels.map(
        (label) => ({ label, value: WidgetCategory[label] }),
      ),
    );
  }

  onSubmit(): void {
    this.chainedRef.close({
      response: null,
      error: false,
    });
  }
}
