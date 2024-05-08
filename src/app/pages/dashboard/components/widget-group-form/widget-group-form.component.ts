import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Injector, ViewChild, ViewContainerRef, computed, signal,
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
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetCategory, widgetCategoryLabels } from 'app/pages/dashboard/types/widget-category.enum';
import {
  FormWidgetGroup,
  WidgetGroup,
  WidgetGroupLayout,
  formWidgetGroupToWidgetGroup,
  layoutToSlotSizes,
  widgetGroupIcons,
  widgetGroupToFormWidgetGroup,
} from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

interface SimpleWidget {
  category: WidgetCategory;
  type: WidgetType;
  [key: string]: unknown;
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-group-form',
  templateUrl: './widget-group-form.component.html',
  styleUrls: ['./widget-group-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupFormComponent implements AfterViewInit {
  protected group = signal<FormWidgetGroup>(
    { layout: WidgetGroupLayout.Full, slots: [{ category: null, type: null }] } as FormWidgetGroup,
  );
  protected selectedSlot = signal(SlotPosition.First);
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

  selectedLayout = signal(WidgetGroupLayout.Full);
  selectedCategory = signal<WidgetCategory>(null);

  widgetCategoriesOptions = computed<Observable<Option[]>>(() => {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets();
    const uniqCategories = new Set(layoutSupportedWidgets.map((widget) => widget.category));

    return of(Array.from(uniqCategories).map((category) => {
      return {
        label: widgetCategoryLabels.get(category) || category,
        value: category,
      };
    }));
  });

  widgetTypesOptions = computed<Observable<Option[]>>(() => {
    const layoutSupportedWidgets = this.getLayoutSupportedWidgets();
    const category = this.selectedCategory();
    const categoryWidgets = layoutSupportedWidgets.filter((widget) => widget.category === category);
    const uniqTypes = new Set(categoryWidgets.map((widget) => widget.type));

    return of(Array.from(uniqTypes).map((type) => {
      return {
        label: widgetRegistry[type].name,
        value: type,
      };
    }));
  });

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    protected chainedRef: ChainedRef<WidgetGroup>,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.setupLayoutUpdates();
    this.setupCategoryUpdate();
    this.setupTypeUpdate();
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
    this.selectedSlot.set(SlotPosition.First);
  }

  ngAfterViewInit(): void {
    this.refreshSettingsContainer();
  }

  private refreshSettingsContainer(): void {
    if (!this.settingsContainer) {
      return;
    }
    this.settingsContainer.remove();
    this.settingsContainer.clear();
    if (
      !this.group().slots[this.selectedSlot()].type
      || !widgetRegistry[this.group().slots[this.selectedSlot()].type].settingsComponent
    ) {
      return;
    }

    this.settingsContainer.createComponent(
      widgetRegistry[this.group().slots[this.selectedSlot()].type].settingsComponent,
      { injector: this.getInjector() },
    );
  }

  setupLayoutUpdates(): void {
    this.form.controls.layout.valueChanges.pipe(
      tap((layout) => {
        this.group.update((group) => ({ ...group, layout }));
        this.selectedLayout.set(layout);
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  setupCategoryUpdate(): void {
    this.form.controls.category.valueChanges.pipe(
      filter(Boolean),
      tap((category) => {
        this.group.update((group) => {
          const newGroup: FormWidgetGroup = { layout: group.layout, slots: [] };
          for (let i = 0; i < layoutToSlotSizes[newGroup.layout].length; i++) {
            if (i as SlotPosition === this.selectedSlot()) {
              newGroup.slots.push({ category, type: null });
            } else {
              newGroup.slots.push(group.slots[i] || { category: null, type: null });
            }
          }
          return newGroup;
        });
        this.form.controls.type.setValue(this.group().slots[this.selectedSlot()].type);

        this.selectedCategory.set(category);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  setupTypeUpdate(): void {
    this.form.controls.type.valueChanges.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe({
      next: (type) => {
        this.group.update((group) => {
          const newGroup = { layout: group.layout, slots: [] } as FormWidgetGroup;
          for (let i = 0; i < layoutToSlotSizes[newGroup.layout].length; i++) {
            if (i as SlotPosition === this.selectedSlot()) {
              newGroup.slots.push({ ...group.slots[i], type });
            } else {
              newGroup.slots.push(group.slots[i]);
            }
          }
          return newGroup;
        });
        this.refreshSettingsContainer();
      },
    });
  }

  getInjector(): Injector {
    return Injector.create({
      providers: [
        {
          provide: WidgetSettingsRef,
          useValue: new WidgetSettingsRef(
            this.selectedSlot(),
            this.group().slots[this.selectedSlot()].settings,
            (slot: SlotPosition, settings: object): void => {
              this.group.update((group) => {
                const newGroup: FormWidgetGroup = { layout: group.layout, slots: [] };
                for (let i = 0; i < layoutToSlotSizes[newGroup.layout].length; i++) {
                  if (i as SlotPosition === slot) {
                    newGroup.slots.push({ ...group.slots[i], settings });
                  } else {
                    newGroup.slots.push(group.slots[i]);
                  }
                }
                return newGroup;
              });
            },
            (slot: SlotPosition, errors: ValidationErrors[]): void => {
              if (!errors) {
                this.validationErrors.update((previousErrors) => {
                  return previousErrors.map(
                    (prevError, index) => (index as SlotPosition === slot ? {} : prevError),
                  );
                });
                return;
              }
              this.validationErrors.update((previousErrors) => {
                return previousErrors.map(
                  (prevError, index) => (index as SlotPosition === slot ? errors : prevError),
                );
              });
            },
          ),
        },
      ],
    });
  }

  selectedSlotChanged(slotIndex: SlotPosition): void {
    if (slotIndex === this.selectedSlot()) {
      return;
    }
    this.selectedSlot.set(slotIndex);
    this.setSlotValues();
  }

  private setSlotValues(): void {
    if (!this.group().slots[this.selectedSlot()]) {
      this.group.update((group) => {
        const newGroup: FormWidgetGroup = { layout: group.layout, slots: [] };
        for (let i = 0; i < layoutToSlotSizes[newGroup.layout].length; i++) {
          if (i as SlotPosition === this.selectedSlot()) {
            newGroup.slots.push({ category: null, type: null });
          } else {
            newGroup.slots.push(group.slots[i] || { category: null, type: null });
          }
        }
        return newGroup;
      });
    }
    const category = this.group().slots[this.selectedSlot()].category;
    this.form.controls.category.setValue(category);
    if (category) {
      this.form.controls.type.setValue(this.group().slots[this.selectedSlot()].type);
    }
    this.refreshSettingsContainer();
  }

  getLayoutSupportedWidgets(): SimpleWidget[] {
    const widgetEntires = Object.entries(widgetRegistry);
    const layout = this.selectedLayout();
    const slotSize = layoutToSlotSizes[layout][this.selectedSlot()];

    return widgetEntires.filter(
      ([, widget]) => widget.supportedSizes.includes(slotSize),
    ).map(([type, widget]) => ({ ...widget, type: type as WidgetType }));
  }

  onSubmit(): void {
    // console.log('group', formWidgetGroupToWidgetGroup(this.group()));
    this.chainedRef.close({
      response: formWidgetGroupToWidgetGroup(this.group()),
      error: false,
    });
  }
}
