import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  templateUrl: './ix-input.component.html',
  styleUrls: ['./ix-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixIcon: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() type: string;

  /** If formatted value returned by parseAndFormatInput has non-numeric letters
   * and input 'type' is a number, the input will stay empty on the form */
  @Input() format: (value: string | number) => string;
  @Input() parse: (value: string | number) => string | number;

  formControl = new FormControl(this).value as FormControl;

  value: string | number = '';
  formatted: string | number = '';
  isDisabled = false;
  shouldUpdateValueAsap = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string | number): void {
    let parsed = value;
    let formatted = value;
    if (value) {
      if (this.parse) {
        parsed = this.parse(value);
        /** This flag exists because when default value is used, onChange is not registered yet
         * So parsed value isn't immediately updated. Furthermore, if the user submits the form with
         * default value, the submitted value isn't parsed in that case either.
         */
        this.shouldUpdateValueAsap = true;
      }
      if (this.format) {
        formatted = this.format(value);
      }
    }
    this.value = parsed;
    this.formatted = formatted;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
    if (this.shouldUpdateValueAsap) {
      this.onChange(this.value);
    }
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return !this.isDisabled && this.hasValue();
  }

  hasValue(): boolean {
    return this.value && this.value.toString().length > 0;
  }

  input(value: string): void {
    this.value = value;
    this.formatted = value;
    if (this.parse && !!value) {
      this.value = this.parse(value);
    }
    this.onChange(this.value);
  }

  resetInput(): void {
    this.value = '';
    this.formatted = '';
    this.onChange('');
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  blur(): void {
    this.onTouch();
    if (this.value) {
      if (this.parse) {
        this.value = this.parse(this.value);
      }
      if (this.format) {
        this.formatted = this.format(this.value);
      }
    }
    this.onChange(this.value);
    this.cdr.markForCheck();
  }
}
