import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  input,
  OnChanges,
  OnInit, Signal, viewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatAutocompleteTrigger, MatAutocomplete } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatError, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  templateUrl: './ix-input.component.html',
  styleUrls: ['./ix-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    IxIconComponent,
    MatInput,
    MatAutocompleteTrigger,
    MatIconButton,
    MatTooltip,
    MatAutocomplete,
    ReactiveFormsModule,
    MatOption,
    MatError,
    IxErrorsComponent,
    MatHint,
    TranslateModule,
    TestOverrideDirective,
    TestDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
})
export class IxInputComponent implements ControlValueAccessor, OnInit, OnChanges {
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly prefixIcon = input<MarkedIcon>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly required = input<boolean>();
  readonly readonly = input<boolean>();
  readonly type = input<string>();
  readonly autocomplete = input('off');
  readonly autocompleteOptions = input<Option[]>();
  readonly maxLength = input(524288);

  /** If formatted value returned by parseAndFormatInput has non-numeric letters
   * and input 'type' is a number, the input will stay empty on the form */
  readonly format = input<(value: string | number) => string>();
  readonly parse = input<(value: string | number) => string | number>();

  readonly inputElementRef: Signal<ElementRef<HTMLInputElement>> = viewChild('ixInput', { read: ElementRef });

  private _value: string | number = this.controlDirective.value as string;
  formatted: string | number = '';

  isDisabled = false;
  showPassword = false;
  invalid = false;
  filteredOptions: Option[];
  private lastKnownValue: string | number = this._value;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('autocompleteOptions' in changes) {
      this.filterOptions();
    }
  }

  ngOnInit(): void {
    if (this.autocompleteOptions()) {
      this.handleAutocompleteOptionsOnInit();
    }
  }

  get value(): string | number {
    return this._value;
  }

  set value(val: string | number) {
    if (this.type() === 'number') {
      this._value = (val || val === 0) ? Number(val) : null;
      return;
    }
    this._value = val;
  }

  writeValue(value: string | number): void {
    let formatted = value;
    if (value && this.format()) {
      formatted = this.format()(value);
    }
    this.formatted = formatted;
    this.value = value;
  }

  input(ixInput: HTMLInputElement): void {
    this.invalid = ixInput.validity?.badInput;
    const value = ixInput.value;
    this.value = value;
    this.formatted = value;
    if (value && this.parse()) {
      this.value = this.parse()(value);
    }
    this.onChange(this.value);
    this.filterOptions();
  }

  invalidMessage(): string {
    return this.translate.instant('Value must be a {type}', {
      type: this.type(),
    });
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = (val) => {
      this.lastKnownValue = val;
      onChange(val);
    };
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return (
      !this.isDisabled
      && this.hasValue()
      && this.type() !== 'password'
      && !this.readonly()
    );
  }

  getType(): string {
    // Mimicking a password field to prevent browsers from remembering passwords.
    const isFakePassword = this.type() === 'password' && (this.autocomplete() === 'off' || this.showPassword);
    return isFakePassword ? 'text' : this.type();
  }

  isPasswordField(): boolean {
    return this.type() === 'password' && !this.showPassword;
  }

  hasValue(): boolean {
    return this.invalid || this.value?.toString()?.length > 0;
  }

  resetInput(inputElement: HTMLInputElement): void {
    inputElement.value = '';
    this.invalid = false;
    this.value = '';
    this.formatted = '';
    this.onChange(this.value);
    this.filterOptions();
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  focus(ixInput: HTMLInputElement): void {
    this.onTouch();
    if (this.readonly()) {
      ixInput.select();
    }
    this.filterOptions('');
  }

  blurred(): void {
    this.onTouch();

    if (this.formatted) {
      if (this.parse()) {
        this.value = this.parse()(this.formatted);
        this.formatted = this.value;
      }
      if (this.format()) {
        this.formatted = this.format()(this.value);
      }
    }

    if (this.value !== this.lastKnownValue) {
      this.lastKnownValue = this.value;
      this.onChange(this.value);
    }

    if (this.autocompleteOptions() && !this.findExistingOption(this.value)) {
      this.writeValue('');
      this.onChange('');
      this.formatted = '';
    }

    this.cdr.markForCheck();
  }

  onPasswordToggled(): void {
    this.showPassword = !this.showPassword;
  }

  optionSelected(option: Option): void {
    if (this.inputElementRef()?.nativeElement) {
      this.inputElementRef().nativeElement.value = option.label;
    }

    this.value = option.value;
    this.onChange(option.value);
    this.cdr.markForCheck();
  }

  filterOptions(customFilterValue?: string): void {
    const filterValue = (customFilterValue ?? this.value) || '';
    if (this.autocompleteOptions()) {
      this.filteredOptions = this.autocompleteOptions().filter((option) => {
        return option.label.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
      }).slice(0, 50);
    }
  }

  private findExistingOption(value: string | number): Option {
    return this.autocompleteOptions()?.find((option) => (option.label === value) || (option.value === value));
  }

  private handleAutocompleteOptionsOnInit(): void {
    // handle input value changes for this.autocomplete options
    this.controlDirective.control.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value: string) => {
      const existingOption = this.findExistingOption(value);

      if (this.autocompleteOptions() && existingOption?.value) {
        this.value = existingOption.value;
        this.onChange(existingOption.value);
        this.cdr.markForCheck();
      }
    });

    // handling initial value formatting from value to label
    if (this.value !== undefined) {
      this.formatted = this.findExistingOption(this.value)?.label ?? '';
    }

    this.filterOptions('');
  }
}
