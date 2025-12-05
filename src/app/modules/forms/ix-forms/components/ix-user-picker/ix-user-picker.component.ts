import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, computed,
  ElementRef,
  inject,
  input,
  OnInit, signal, Signal, viewChild,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatOption } from '@angular/material/core';
import { MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  fromEvent,
  of,
  Subject,
} from 'rxjs';
import {
  catchError,
  debounceTime, distinctUntilChanged, filter, map, switchMap, takeUntil,
  tap,
} from 'rxjs/operators';
import { newOption, Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { UserPickerProvider } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker-provider';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-picker',
  templateUrl: './ix-user-picker.component.html',
  styleUrls: ['./ix-user-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxLabelComponent,
    MatInput,
    MatAutocompleteTrigger,
    MatProgressSpinner,
    IxIconComponent,
    MatAutocomplete,
    MatOption,
    IxErrorsComponent,
    MatHint,
    ReactiveFormsModule,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxUserPickerComponent implements ControlValueAccessor, OnInit {
  controlDirective = inject(NgControl);
  private cdr = inject(ChangeDetectorRef);
  private errorHandler = inject(ErrorHandlerService);

  readonly label = input<TranslatedString>();
  readonly hint = input<TranslatedString>();
  readonly required = input<boolean>(false);
  readonly tooltip = input<TranslatedString>();
  readonly allowCustomValue = input(false);

  readonly provider = input.required<UserPickerProvider>();
  readonly translate = inject(TranslateService);
  readonly slideIn = inject(SlideIn);

  private comboboxProviderHandler = computed(() => {
    return this.provider();
  });

  private readonly inputElementRef: Signal<ElementRef<HTMLInputElement>> = viewChild.required('ixInput', { read: ElementRef });
  private readonly autoCompleteRef = viewChild.required('auto', { read: MatAutocomplete });
  private readonly autocompleteTrigger = viewChild(MatAutocompleteTrigger);

  options = signal<Option[]>([]);
  getDisplayWith = this.displayWith.bind(this);
  hasErrorInOptions = signal(false);
  loading = signal(false);

  private filterChanged$ = new Subject<string>();

  value: string | number | null = '';
  isDisabled = false;
  filterValue: string | null | undefined;
  selectedOption = signal<Option | null>(null);
  textContent = '';

  onChange: (value: string | number | null) => void = (): void => {};
  onTouch: () => void = (): void => {};

  protected readonly addNewUserOption = {
    label: this.translate.instant('Add New'),
    value: newOption,
    disabled: false,
  };

  constructor() {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string | number): void {
    this.value = value;
    if (this.value && this.options()?.length) {
      const nextOption = this.options().find((option: Option) => option.value === this.value);
      this.selectedOption.set(nextOption);
    }
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    if (this.controlDirective.value) {
      this.textContent = this.controlDirective.value as string;
    }

    this.listenForAddNew();

    this.filterChanged$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((changedValue) => {
      if (this.filterValue === changedValue) {
        return;
      }
      this.filterValue = changedValue;
      this.filterOptions(changedValue);
    });

    this.filterChanged$.next('');
  }

  inputBlurred(): void {
    this.onTouch();

    if (!this.allowCustomValue() && !this.selectedOption()) {
      this.resetInput();
    }
  }

  filterOptions(filterValue: string): void {
    this.loading.set(true);
    this.cdr.markForCheck();

    this.comboboxProviderHandler()?.fetch(filterValue).pipe(
      catchError(() => {
        this.hasErrorInOptions.set(true);
        // Return empty array to show "Add New" option even on error
        return of<Option[]>([]);
      }),
      untilDestroyed(this),
    ).subscribe((options: Option[]) => {
      // Reset error flag on successful fetch
      if (options.length > 0 || !this.hasErrorInOptions()) {
        this.hasErrorInOptions.set(false);
      }

      // Always include "Add New" option
      this.options.set([this.addNewUserOption, ...options]);

      const selectedOptionFromLabel = this.options().find((option) => option.label === filterValue);
      if (selectedOptionFromLabel) {
        this.selectedOption.set(selectedOptionFromLabel);
        this.value = selectedOptionFromLabel.value;
        this.onChange(this.value);
      } else if (this.value !== null) {
        const selectedOptionFromValue = this.options().find((option) => option.value === this.value);
        if (selectedOptionFromValue) {
          this.selectedOption.set({ ...selectedOptionFromValue });
        } else {
          // If selected value is not in fetched options, add it manually
          // This handles newly created items that may not be in the backend cache yet
          const missingOption = { label: this.value as string, value: this.value };
          this.selectedOption.set(missingOption);
          this.options.set([this.addNewUserOption, missingOption, ...options]);
        }
      }

      this.loading.set(false);
      this.cdr.markForCheck();
    });
  }

  onOpenDropdown(): void {
    setTimeout(() => {
      const autoCompleteRef = this.autoCompleteRef();
      const autocompleteTrigger = this.autocompleteTrigger();
      if (
        !autoCompleteRef
        || !autocompleteTrigger
        || !autoCompleteRef.panel
      ) {
        return;
      }
      const elementRef = autoCompleteRef.panel as ElementRef<HTMLElement>;
      fromEvent(elementRef.nativeElement, 'scroll')
        .pipe(
          debounceTime(300),
          map(() => elementRef.nativeElement.scrollTop),
          takeUntil(autocompleteTrigger.panelClosingActions),
          untilDestroyed(this),
        ).subscribe(() => {
          const {
            scrollTop,
            scrollHeight,
            clientHeight: elementHeight,
          } = elementRef.nativeElement;

          const atBottom = scrollHeight === scrollTop + elementHeight;
          if (!atBottom) {
            return;
          }

          this.loading.set(true);
          this.cdr.markForCheck();

          const nextPage = this.filterValue ?? '';
          this.comboboxProviderHandler()?.nextPage(nextPage)
            .pipe(untilDestroyed(this)).subscribe((options) => {
              this.loading.set(false);
              this.cdr.markForCheck();
              /**
               * The following logic checks if we used a fake option to show value for an option that exists
               * on one of the following pages of the list of options for this combobox. If we have done so
               * previously, we want to remove that option if we managed to find the correct option on the
               * page we just fetched
               */
              const valueIndex = this.options().findIndex(
                (option) => option.label === (this.value as string) && option.value === this.value,
              );

              if (
                options.some((option) => option.value === this.value)
                && valueIndex >= 0
              ) {
                this.options().splice(valueIndex, 1);
              }
              this.options().push(...options);
              this.cdr.markForCheck();
            });
        });
    });
  }

  onChanged(changedValue: string): void {
    if (this.selectedOption()?.value || this.value) {
      this.resetInput();
    }
    this.textContent = changedValue;
    this.filterChanged$.next(changedValue);

    if (this.allowCustomValue() && !this.options().some((option: Option) => option.value === changedValue)) {
      this.onChange(changedValue);
    }
  }

  resetInput(): void {
    this.filterChanged$.next('');
    if (this.inputElementRef()?.nativeElement) {
      this.inputElementRef().nativeElement.value = '';
    }
    this.selectedOption.set(null);
    this.value = null;
    this.textContent = '';
    this.onChange(null);
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  optionSelected(option: Option): void {
    this.selectedOption.set({ ...option });
    this.filterChanged$.next('');
    this.value = this.selectedOption().value;
    this.onChange(this.selectedOption().value);
    this.cdr.markForCheck();
  }

  displayWith(): string {
    return this.selectedOption() ? this.selectedOption().label : '';
  }

  shouldShowResetInput(): boolean {
    return this.hasValue() && !this.isDisabled;
  }

  hasValue(): boolean {
    return !!this.inputElementRef()?.nativeElement?.value && this.inputElementRef().nativeElement.value.length > 0;
  }

  isValueFromOptions(value: string): boolean {
    return this.options().some((option) => option.label === value);
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  /**
   * Type guard to check if provider has a valueField property
   */
  private hasValueField(provider: unknown): provider is { valueField: keyof Pick<User, 'username' | 'uid' | 'id'> } {
    return provider !== null
      && typeof provider === 'object'
      && 'valueField' in provider
      && (provider.valueField === 'username' || provider.valueField === 'uid' || provider.valueField === 'id');
  }

  getValueFromSlideInResponse(result: SlideInResponse<User>): string | number {
    const provider = this.comboboxProviderHandler();
    const valueField: keyof Pick<User, 'username' | 'uid' | 'id'> = this.hasValueField(provider)
      ? provider.valueField
      : 'username';
    return result.response[valueField];
  }

  private listenForAddNew(): void {
    this.controlDirective?.control?.valueChanges?.pipe(
      distinctUntilChanged(),
      filter((selectedOption) => selectedOption === newOption),
      switchMap(() => this.slideIn.open(UserFormComponent, { wide: true })),
      catchError((error: unknown) => {
        // Handle slide-in errors gracefully
        this.errorHandler.handleError(error);
        // Clear selection to allow "Add New" to be clicked again
        this.selectedOption.set(null);
        if (this.inputElementRef()?.nativeElement) {
          this.inputElementRef().nativeElement.value = '';
        }
        this.autocompleteTrigger()?.closePanel();
        return of(null);
      }),
      filter((response) => response !== null),
      tap((response: SlideInResponse<User>) => {
        if (!response.error && response.response) {
          // User created successfully - select the newly created user
          const newUser = response.response;
          const newUserOption: Option = {
            label: newUser.username,
            value: this.getValueFromSlideInResponse(response),
          };

          this.selectedOption.set(newUserOption);
          this.value = newUserOption.value;
          if (this.inputElementRef()?.nativeElement) {
            this.inputElementRef().nativeElement.value = newUserOption.label;
          }
          this.onChange(newUserOption.value);

          // Add the newly created user to the options list immediately
          // This avoids race conditions with the debounced filterChanged$ observable
          const existingOptions = this.options().slice(1); // Remove "Add New" from index 0
          // Check if user already exists to prevent duplicates
          if (!existingOptions.some((opt) => opt.value === newUserOption.value)) {
            this.options.set([this.addNewUserOption, newUserOption, ...existingOptions]);
          }

          this.cdr.markForCheck();
        } else {
          // User cancelled - clear selection to allow "Add New" to be clicked again
          this.selectedOption.set(null);
          if (this.inputElementRef()?.nativeElement) {
            this.inputElementRef().nativeElement.value = '';
          }
        }

        // Close panel immediately - the selection is already set
        this.autocompleteTrigger()?.closePanel();
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
