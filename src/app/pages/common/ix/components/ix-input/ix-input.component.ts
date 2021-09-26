import {
  Component, forwardRef, Input,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  styleUrls: ['./ix-input.component.scss'],
  templateUrl: './ix-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IxInputComponent),
      multi: true,
    },
  ],
})
export class IxInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixText: string;
  @Input() prefixIcon: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  formControl = new FormControl(this).value as FormControl;

  value = '';
  touched = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    this.onTouch();
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  shouldShowResetInput(): boolean {
    return this.hasValue();
  }

  hasValue(): boolean {
    return this.value && this.value.length > 0;
  }

  resetInput(): void {
    this.value = '';
    this.onChange('');
  }
}
