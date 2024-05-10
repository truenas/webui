import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnChanges,
  ViewChild,
  ViewContainerRef,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormBuilder, ValidationErrors, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, Subscription, of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { SimpleWidget } from 'app/pages/dashboard/types/simple-widget.interface';
import { WidgetCategory, widgetCategoryLabels } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetGroupSlot } from 'app/pages/dashboard/types/widget-group-slot.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-slot-form',
  templateUrl: './widget-group-slot-form.component.html',
  styleUrl: './widget-group-slot-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupSlotFormComponent implements AfterViewInit, OnChanges {
  slotConfig = input.required<WidgetGroupSlot<object>>();
  slot = signal<WidgetGroupSlot<object>>(null);
  categorySubscription: Subscription;
  typeSubscription: Subscription;
  settingsValidionErrors = signal({} as ValidationErrors);

  @ViewChild('settingsContainer', { static: true, read: ViewContainerRef }) settingsContainer: ViewContainerRef;
  widgetCategoriesOptions = computed<Observable<Option[]>>(() => {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets();
    const uniqCategories = new Set(layoutSupportedWidgets.map((widget) => widget.category));

    const options = Array.from(uniqCategories).map((category) => {
      return {
        label: widgetCategoryLabels.get(category) || category,
        value: category,
      };
    });
    return of(options);
  });

  validityChange = output<[number, ValidationErrors]>();
  settingsChange = output<WidgetGroupSlot<object>>();

  widgetTypesOptions = computed<Observable<Option[]>>(() => {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets();
    const category = this.slot().category;
    const categoryWidgets = layoutSupportedWidgets.filter((widget) => widget.category === category);
    const uniqTypes = new Set(categoryWidgets.map((widget) => widget.type));

    return of(Array.from(uniqTypes).map((type) => {
      return {
        label: widgetRegistry[type].name,
        value: type,
      };
    }));
  });

  form = this.fb.group({
    category: [null as WidgetCategory, [Validators.required]],
    type: [null as WidgetType, [Validators.required]],
  });

  constructor(private fb: FormBuilder) { }

  setupFormValueUpdates(): void {
    this.setupCategoryUpdates();
    this.setupTypeUpdates();
  }

  setupCategoryUpdates(): void {
    this.categorySubscription = this.form.controls.category.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (category) => {
        this.slot.update((slot) => {
          return {
            ...slot,
            category,
            type: null,
            settings: undefined,
          };
        });
        this.settingsChange.emit(this.slot());
      },
    });
  }

  setupTypeUpdates(): void {
    this.typeSubscription = this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (type) => {
        this.slot.update((slot) => {
          return {
            ...slot,
            type,
            settings: undefined,
          };
        });
        this.refreshSettingsContainer();
        this.settingsChange.emit(this.slot());
      },
    });
  }

  ngOnChanges(): void {
    this.setValuesFromInput();
  }

  ngAfterViewInit(): void {
    this.refreshSettingsContainer();
  }

  setValuesFromInput(): void {
    this.clearUpdates();
    const slotConfig = this.slotConfig();
    this.slot.set(slotConfig);
    this.form.controls.category.setValue(slotConfig.category);
    this.form.controls.type.setValue(slotConfig.type);
    this.refreshSettingsContainer();
    this.setupFormValueUpdates();
  }

  clearUpdates(): void {
    this.categorySubscription?.unsubscribe();
    this.typeSubscription?.unsubscribe();
    this.settingsContainer?.clear();
  }

  private refreshSettingsContainer(): void {
    if (!this.settingsContainer) {
      return;
    }
    this.settingsContainer.remove();
    this.settingsContainer.clear();
    if (
      !this.slot()?.type
      || !widgetRegistry[this.slot().type as WidgetType].settingsComponent
    ) {
      return;
    }

    this.settingsContainer.createComponent(
      widgetRegistry[this.slot().type].settingsComponent,
      { injector: this.getInjector() },
    );
  }

  getInjector(): Injector {
    return Injector.create({
      providers: [
        {
          provide: WidgetSettingsRef,
          useValue: new WidgetSettingsRef(
            this.slot().settings,
            (settings: object): void => {
              this.slot.update((slot) => {
                return {
                  ...slot,
                  settings,
                };
              });
              this.settingsChange.emit(this.slot());
            },
            (errors: ValidationErrors): void => {
              if (!errors) {
                errors = {} as ValidationErrors;
                return;
              }
              this.validityChange.emit([this.slot().slotPosition, errors]);
            },
          ),
        },
      ],
    });
  }

  getLayoutSupportedWidgets(): SimpleWidget[] {
    const widgetEntires = Object.entries(widgetRegistry);
    const slotSize = this.slot().slotSize;

    return widgetEntires.filter(
      ([, widget]) => widget.supportedSizes.includes(slotSize),
    ).map(([type, widget]) => ({ ...widget, type: type as WidgetType }));
  }
}
