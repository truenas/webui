import {
  Directive, OnInit, inject, DestroyRef, input, effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, merge, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ComponentInSlideIn } from 'app/modules/slide-ins/slide-in.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';

export const addNewIxSelectValue = 'ADD_NEW';

/**
 * Base for the custom "select with an Add New option" controls (cloud / SSH credentials). It renders
 * a `<tn-select>` bound to {@link selectControl} and is itself the {@link ControlValueAccessor} for the
 * host's `formControlName` — subclasses provide it via `NG_VALUE_ACCESSOR`. Picking the prepended
 * "Add New" option opens the relevant create form in a legacy SlideIn (kept here because we need the
 * saved entity back to select it — `FormSidePanelService` only resolves a boolean), then refetches the
 * options and selects the new record; cancelling restores the previous value.
 */
@Directive()
export abstract class IxSelectWithNewOption<R = unknown> implements ControlValueAccessor, OnInit {
  formComponentIsWide = false;

  // Shared chrome inputs — the same on every subclass, bound by their `<tn-form-field>`/`<tn-select>`.
  readonly label = input<TranslatedString>();
  readonly tooltip = input<TranslatedString>();
  readonly required = input<boolean>(false);

  /** Drives the inner `<tn-select>`. The directive mediates between it and the host's form control. */
  protected readonly selectControl = new FormControl<IxSelectValue>(null);
  /** "Add New" + the fetched options, fed to `<tn-select [options]>`. */
  protected readonly options$ = new BehaviorSubject<Option[]>([]);

  private slideIn = inject(SlideIn);
  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Mirror the host's required state onto the inner control so `<tn-form-field>` renders the inline
    // "required" error: the field reads validity from the `<tn-select>` it wraps (bound to
    // selectControl), not from the host's form control, which carries the actual validator.
    effect(() => {
      this.selectControl.setValidators(this.required() ? [Validators.required] : []);
      this.selectControl.updateValueAndValidity({ emitEvent: false });
    });
  }

  /** Last real (non-"Add New") value, used to restore the selection when the create form is cancelled. */
  private previousValue: IxSelectValue = null;
  private onChange: (value: IxSelectValue) => void = (): void => {};
  private onTouched: () => void = (): void => {};

  abstract fetchOptions(): Observable<Option[]>;
  abstract getValueFromSlideInResponse(result: R): IxSelectValue;
  abstract getFormComponentType(): ComponentInSlideIn<unknown, R>;
  getFormInputData(): Record<string, unknown> | undefined {
    return undefined;
  }

  ngOnInit(): void {
    this.loadOptions().pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();

    this.selectControl.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((value) => {
      if (value === addNewIxSelectValue) {
        this.openNewForm();
        return;
      }
      this.previousValue = value;
      this.onChange(value);
      this.onTouched();
    });
  }

  writeValue(value: IxSelectValue): void {
    this.previousValue = value;
    this.selectControl.setValue(value, { emitEvent: false });
  }

  registerOnChange(onChange: (value: IxSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectControl.disable({ emitEvent: false });
    } else {
      this.selectControl.enable({ emitEvent: false });
    }
  }

  private loadOptions(): Observable<Option[]> {
    return this.fetchOptions().pipe(
      tap((options) => this.options$.next(this.prependAddNew(options))),
    );
  }

  private openNewForm(): void {
    const previous = this.previousValue;
    const result$ = this.slideIn.open(this.getFormComponentType(), {
      wide: this.formComponentIsWide,
      data: this.getFormInputData(),
    });

    merge(
      result$.success$.pipe(
        switchMap((response) => {
          const newValue = this.getValueFromSlideInResponse(response);
          // Refetch first so the freshly created record is among the options before we select it.
          return this.loadOptions().pipe(
            tap(() => {
              this.previousValue = newValue;
              this.selectControl.setValue(newValue, { emitEvent: false });
              this.onChange(newValue);
            }),
          );
        }),
      ),
      result$.cancel$.pipe(
        tap(() => this.selectControl.setValue(previous ?? null, { emitEvent: false })),
      ),
    ).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  private prependAddNew(options: Option[]): Option[] {
    return [
      { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
      ...options,
    ];
  }
}
