import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EnvironmentInjector,
  Injector,
  OnChanges,
  OnInit,
  Signal,
  Type,
  ViewChild,
  ViewContainerRef,
  WritableSignal,
  computed,
  inject,
  input,
  output,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder, ValidationErrors, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Observable, Subscription, combineLatest, map, of, switchMap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { SimpleWidget } from 'app/pages/dashboard/types/simple-widget.interface';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetCategory, widgetCategoryLabels } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetSettingsComponent, WidgetVisibilityDepsType } from 'app/pages/dashboard/types/widget-component.interface';
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
export class WidgetGroupSlotFormComponent implements OnInit, AfterViewInit, OnChanges {
  slotConfig = input.required<WidgetGroupSlot<object>>();
  slot = signal<WidgetGroupSlot<object>>(null);

  protected selectedCategory: WritableSignal<WidgetCategory>;

  private categorySubscription: Subscription;
  private typeSubscription: Subscription;

  protected get shouldShowType(): boolean {
    return this.selectedCategory != null
      ? this.selectedCategory() && this.selectedCategory() !== WidgetCategory.Empty
      : false;
  }

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
    return of([{ label: widgetCategoryLabels.get(WidgetCategory.Empty), value: WidgetCategory.Empty }, ...options]);
  });

  validityChange = output<[SlotPosition, ValidationErrors]>();
  settingsChange = output<WidgetGroupSlot<object>>();

  widgetTypesOptions = computed<Observable<Option[]>>(() => {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets();
    const category = this.selectedCategory();
    const categoryWidgets = layoutSupportedWidgets.filter((widget) => widget.category === category);
    if (!categoryWidgets.length) {
      return of([]);
    }
    const uniqTypes = new Set(categoryWidgets.map((widget) => widget.type));

    const typeOptions = Array.from(uniqTypes).map((type) => {
      return {
        label: widgetRegistry[type].name,
        value: type,
      };
    });
    if (!this.form.controls.type.value || !Array.from(uniqTypes).includes(this.form.controls.type.value)) {
      this.form.controls.type.setValue(typeOptions[0].value);
    }
    return of(typeOptions);
  });

  getLayoutSupportedWidgets: Signal<SimpleWidget[]>;

  form = this.fb.group({
    category: [null as WidgetCategory, [Validators.required]],
    type: [null as WidgetType, [Validators.required]],
  });

  private environmentInjector = inject(EnvironmentInjector);
  private widgetRegistryEntries = Object.entries(widgetRegistry);

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) { }

  setupFormValueUpdates(): void {
    this.setupCategoryUpdates();
    this.setupTypeUpdates();
  }

  setupCategoryUpdates(): void {
    this.categorySubscription = this.form.controls.category.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (category) => {
        if (category === WidgetCategory.Empty) {
          this.slot.update((slot) => {
            return {
              ...slot,
              type: null,
              settings: undefined,
            } as WidgetGroupSlot<object>;
          });
          this.refreshSettingsContainer();
        }
        this.updateSelectedCategory(category);
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

  private updateSelectedCategory(category: WidgetCategory): void {
    if (!this.selectedCategory) {
      this.selectedCategory = signal<WidgetCategory>(category);
    } else {
      this.selectedCategory.set(category);
    }
    this.cdr.markForCheck();
  }

  ngOnChanges(): void {
    this.setValuesFromInput();
  }

  ngOnInit(): void {
    runInInjectionContext(this.environmentInjector, () => {
      this.getLayoutSupportedWidgets = toSignal(of(this.widgetRegistryEntries).pipe(
        switchMap((widgets) => combineLatest(this.getVisibilityList(widgets))),
        map(([widgets, visibilityList]) => this.filterHiddenWidgets(widgets, visibilityList)),
        map((widgets) => this.filterUnsupportedWidgets(widgets)),
        map((widgets) => widgets.map(([type, widget]) => ({ ...widget, type: type as WidgetType }))),
      ));
    });
  }

  ngAfterViewInit(): void {
    this.refreshSettingsContainer();
  }

  setValuesFromInput(): void {
    this.clearUpdates();
    const slotConfig = this.slotConfig();

    this.slot.set(slotConfig);
    if (!slotConfig.type) {
      this.form.controls.category.setValue(null);
      this.updateSelectedCategory(null);
      this.form.controls.type.setValue(null);
      this.setupFormValueUpdates();
      return;
    }
    const category = widgetRegistry[slotConfig.type]?.category;
    this.form.controls.category.setValue(category);
    this.updateSelectedCategory(category);
    this.form.controls.type.setValue(slotConfig.type);
    this.refreshSettingsContainer();
    this.setupFormValueUpdates();
  }

  clearUpdates(): void {
    this.categorySubscription?.unsubscribe();
    this.typeSubscription?.unsubscribe();
    this.settingsContainer?.clear();
  }

  private getVisibilityList(
    widgets: typeof this.widgetRegistryEntries,
  ): [Observable<typeof this.widgetRegistryEntries>, Observable<boolean[]>] {
    const visibilityList = widgets.map(([, widget]) => {
      if (widget.visibility) {
        const deps: WidgetVisibilityDepsType = new Map();
        widget.visibility.deps.forEach((service) => deps.set(service, inject(service)));
        return widget.visibility.isVisible$(deps);
      }
      return of(true);
    });
    return [of(widgets), combineLatest(visibilityList)];
  }

  private filterHiddenWidgets(
    widgets: typeof this.widgetRegistryEntries,
    visibilityList: boolean[],
  ): typeof this.widgetRegistryEntries {
    return widgets.filter((_, idx) => visibilityList[idx]);
  }

  private filterUnsupportedWidgets(
    widgets: typeof this.widgetRegistryEntries,
  ): typeof this.widgetRegistryEntries {
    return widgets.filter(([, widget]) => widget.supportedSizes.includes(this.slotConfig().slotSize));
  }

  private refreshSettingsContainer(): void {
    if (!this.settingsContainer) {
      return;
    }
    this.settingsContainer.remove();
    this.settingsContainer.clear();
    const slotConfig = this.slot();
    if (slotConfig) {
      this.validityChange.emit([slotConfig.slotPosition, {} as ValidationErrors]);
      this.settingsChange.emit({ ...slotConfig, settings: undefined });
    }

    const settingsComponent: Type<WidgetSettingsComponent<object>> = widgetRegistry[slotConfig.type]?.settingsComponent;

    if (!slotConfig?.type || !settingsComponent) {
      return;
    }

    this.settingsContainer.createComponent(settingsComponent, { injector: this.getInjector() });
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
}
