import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, ViewChild, ViewContainerRef, signal,
} from '@angular/core';
import {
  FormBuilder, ValidationErrors, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, filter, of, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { WidgetCategory, widgetCategoryLabels } from 'app/pages/dashboard/types/widget-category.enum';
import {
  WidgetGroup, WidgetGroupLayout, layoutToSlotSizes, widgetGroupIcons,
} from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { Widget, WidgetType, widgetTypeLabels } from 'app/pages/dashboard/types/widget.interface';
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
  @ViewChild('settingsContainer', { static: true, read: ViewContainerRef }) settingsContainer: ViewContainerRef;

  validationErrors = signal([
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
    {} as ValidationErrors,
  ]);

  form = this.fb.group({
    template: [''],
    layout: [WidgetGroupLayout.Full as WidgetGroupLayout, [Validators.required]],
    category: [null as WidgetCategory, [Validators.required]],
    type: [null as WidgetType, [Validators.required]],
  });

  get hasErrors(): boolean {
    return this.form.invalid || !!this.validationErrors().some((errors) => !!Object.keys(errors).length);
  }

  protected readonly layoutsMap = widgetGroupIcons;
  protected readonly widgetRegistry = widgetRegistry;

  widgetCategoriesOptions$: Observable<Option[]>;
  widgetTypesOptions$: Observable<Option[]>;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    protected chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.setCategoryOptions();
    this.setInitialFormValues();
    this.setupLayoutUpdates();
    this.setupCategoryUpdate();
    this.setupTypeUpdate();
  }

  setupTypeUpdate(): void {
    this.form.controls.type.valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: (type) => {
        this.group.slots[this.selectedSlot].type = type;
        this.settingsContainer?.clear();
        if (!widgetRegistry[type].settingsComponent) {
          return;
        }
        this.settingsContainer.createComponent(
          widgetRegistry[type].settingsComponent,
          { injector: this.getInjector() },
        );
      },
    });
  }

  getInjector(): Injector {
    return Injector.create({
      providers: [
        {
          provide: WidgetSettingsRef,
          useValue: {
            getData: () => ({
              slot: this.selectedSlot,
              settings: this.group.slots[this.selectedSlot].settings,
            }),
            updateSettings: (slot: number, settings: object): void => {
              this.group.slots[slot].settings = settings;
            },
            updateValidity: (slot: number, errors: ValidationErrors[]): void => {
              if (!errors) {
                this.validationErrors.update((previousErrors) => {
                  return previousErrors.map((prevError, index) => (index === slot ? {} : prevError));
                });
                return;
              }
              this.validationErrors.update((previousErrors) => {
                return previousErrors.map((prevError, index) => (index === slot ? errors : prevError));
              });
            },
          } as WidgetSettingsRef,
        },
      ],
    });
  }

  setInitialFormValues(): void {
    this.group = this.chainedRef.getData();
    if (!this.group) {
      this.group = { layout: WidgetGroupLayout.Full, slots: [{ category: null, type: null }] };
      return;
    }
    this.form.controls.layout.setValue(this.group.layout);
    for (let i = 0; i < this.group.slots.length; i++) {
      this.selectedSlot = i;
      this.form.controls.category.setValue(this.group.slots[i].category);
      this.form.controls.type.setValue(this.group.slots[i].type);
    }
  }

  setupLayoutUpdates(): void {
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group = { ...this.group, layout };
        this.resetSlot();
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  setupCategoryUpdate(): void {
    this.form.controls.category.valueChanges.pipe(
      filter(Boolean),
      tap((category) => {
        if (!this.group.slots[this.selectedSlot]) {
          this.group.slots[this.selectedSlot] = { category: null, type: null };
        }
        this.group.slots[this.selectedSlot].category = category;
        this.setWidgetTypeOptions(category);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  selectedSlotChanged(slotIndex: number): void {
    this.selectedSlot = slotIndex;
    this.resetSlot();
  }

  resetSlot(): void {
    this.form.controls.category.setValue(null);
    this.form.controls.type.setValue(null);
    this.setCategoryOptions();
  }

  setCategoryOptions(): void {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets() as Widget[];
    const uniqCategories = new Set(layoutSupportedWidgets.map((widget) => widget.category));

    this.widgetCategoriesOptions$ = of(Array.from(uniqCategories).map((category) => {
      return {
        label: widgetCategoryLabels.get(category) || category,
        value: category,
      };
    }));
  }

  setWidgetTypeOptions(category: WidgetCategory): void {
    this.form.controls.type.setValue(null);
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets() as Widget[];
    const categoryWidgets = layoutSupportedWidgets.filter((widget) => widget.category === category);
    const uniqTypes = new Set(categoryWidgets.map((widget) => widget.type));

    const options = Array.from(uniqTypes).map((type) => {
      return {
        label: widgetTypeLabels.get(type) || type,
        value: type,
      };
    });
    this.widgetTypesOptions$ = of(options);
  }

  getLayoutSupportedWidgets(): { type: WidgetType; category: WidgetCategory; [key: string]: unknown }[] {
    const widgetsEntires = Object.entries(widgetRegistry);
    const layout = this.form.controls.layout.value;
    const slotSize = layoutToSlotSizes[layout][this.selectedSlot];

    return widgetsEntires.filter(
      ([, widget]) => widget.supportedSizes.includes(slotSize),
    ).map(([type, widget]) => ({ ...widget, type: type as WidgetType }));
  }

  onSubmit(): void {
    // console.log('group', this.group);
    this.chainedRef.close({
      response: this.group,
      error: false,
    });
  }
}
