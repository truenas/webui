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
  EMPTY,
  fromEvent,
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
import { OldUserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

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
  readonly label = input<string>();
  readonly hint = input<string>();
  readonly required = input<boolean>(false);
  readonly tooltip = input<string>();
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

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
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
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe((options) => {
      if (this.hasErrorInOptions()) {
        this.options.set(options);
      } else {
        this.options.set([this.addNewUserOption, ...options]);
      }

      const selectedOptionFromLabel = this.options().find((option) => option.label === filterValue);
      if (selectedOptionFromLabel) {
        this.selectedOption.set(selectedOptionFromLabel);
        this.value = selectedOptionFromLabel.value;
        this.onChange(this.value);
      } else if (this.value !== null) {
        const selectedOptionFromValue = this.options().find((option) => option.value === this.value);
        this.selectedOption.set(selectedOptionFromValue
          ? { ...selectedOptionFromValue }
          : { label: this.value as string, value: this.value });
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

          const nextPage = this.filterValue !== null && this.filterValue !== undefined ? this.filterValue : '';
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

  getValueFromSlideInResponse(result: SlideInResponse<User>): string {
    return result.response.username;
  }

  listenForAddNew(): void {
    this.controlDirective?.control?.valueChanges?.pipe(
      distinctUntilChanged(),
      filter((selectedOption) => selectedOption === newOption),
      switchMap(() => this.slideIn.open(OldUserFormComponent, { wide: true })),
      filter((response: SlideInResponse) => !response.error),
      tap((response: SlideInResponse<User>) => {
        // TODO: Handle it better. Show all users and select newly created.
        this.filterChanged$.next(this.getValueFromSlideInResponse(response));
        // TODO: Make it better. Rely on close event of slide-in.
        setTimeout(() => this.autocompleteTrigger().closePanel(), 350);
      }),
      untilDestroyed(this),
    ).subscribe();
  }
}
