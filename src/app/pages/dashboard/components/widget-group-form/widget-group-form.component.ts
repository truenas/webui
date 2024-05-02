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
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
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
    type: [null as WidgetType],
  });
  readonly layoutsMap = widgetGroupIcons;

  widgetCategoriesOptions$: Observable<Option[]>;
  widgetTypesOptions$: Observable<Option[]>;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    private formBuilder: FormBuilder,
    private chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
  ) {
    this.setCategoryOptions();
    this.setInitialFormValues();
    this.setupLayoutUpdates();
    this.setupCategoryUpdate();
  }

  setInitialFormValues(): void {
    this.group = this.chainedRef.getData();
    this.form.controls.layout.setValue(this.group.layout);
  }

  setupLayoutUpdates(): void {
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group = { ...this.group, layout };
        this.form.controls.category.setValue(null);
        this.setCategoryOptions();
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  setupCategoryUpdate(): void {
    this.form.controls.category.valueChanges.pipe(
      tap((category) => {
        this.setWidgetTypeOptions(category);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  selectedSlotChanged(slotIndex: number): void {
    this.selectedSlot = slotIndex;
    this.setCategoryOptions();
  }

  getEnumKeyByEnumValue<T extends Record<string, string>>(
    myEnum: T,
    enumValue: string,
  ): keyof T | null {
    const keys = Object.keys(myEnum).filter((x) => myEnum[x] === enumValue);
    return keys.length > 0 ? keys[0] : null;
  }

  setCategoryOptions(): void {
    const widgets = Object.values(widgetRegistry);
    const categories = new Map<keyof typeof WidgetCategory, WidgetCategory>();
    const layout = this.form.controls.layout.value;
    const slotIndex = this.selectedSlot;
    const slotSize = layoutToSlotSizes[layout][slotIndex];
    for (const widget of widgets) {
      if (widget.supportedSizes.includes(slotSize)) {
        const categoryName = this.getEnumKeyByEnumValue(WidgetCategory, widget.category);
        categories.set(categoryName as keyof typeof WidgetCategory, widget.category);
      }
    }
    this.widgetCategoriesOptions$ = of(
      Array.from(categories.entries()).map(
        ([key, value]) => {
          return ({ label: key, value });
        },
      ),
    );
  }

  setWidgetTypeOptions(category: WidgetCategory): void {
    const layout = this.form.controls.layout.value;
    const slotIndex = this.selectedSlot;
    const slotSize = layoutToSlotSizes[layout][slotIndex];

    const sizeSuitedTypes = Object.values(WidgetType).filter((type) => {
      const widget = widgetRegistry[type];
      if (widget.category === category && widget.supportedSizes.includes(slotSize)) {
        return true;
      }

      return false;
    });

    this.widgetTypesOptions$ = of(sizeSuitedTypes.map((type) => {
      return { label: this.getEnumKeyByEnumValue(WidgetType, type), value: type };
    }));
  }

  onSubmit(): void {
    this.chainedRef.close({
      response: null,
      error: false,
    });
  }
}
