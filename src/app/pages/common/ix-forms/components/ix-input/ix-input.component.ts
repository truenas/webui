import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl } from '@angular/forms';
import { MAT_INPUT_VALUE_ACCESSOR } from '@angular/material/input';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  templateUrl: './ix-input.component.html',
  styleUrls: ['./ix-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_INPUT_VALUE_ACCESSOR, useExisting: IxInputComponent },
  ],
})
export class IxInputComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixIcon: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() type: string;
  @Input() formatInput: { formatValue: (value: string) => string; unformatValue: (value: string) => string };

  @ViewChild('ixInput') elementRef: ElementRef;

  formControl = new FormControl(this).value as FormControl;

  value = '';
  isDisabled = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  isInputMasked(): boolean {
    if (this.formatInput && this.formatInput.formatValue && this.formatInput.unformatValue) {
      return true;
    }
    if (this.formatInput && (this.formatInput.formatValue || this.formatInput.unformatValue)) {
      console.error('`' + this.label, '` : Provide both formatValue and unformatValue to mask the input.');
    }
    return false;
  }

  writeValue(value: string): void {
    this.value = value;
    this.onChange(value);
    this.handleFormatValue(value);
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
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

  resetInput(): void {
    this.value = '';
    this.onChange('');
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  focus(): void {
    this.onTouch();
    if (this.isInputMasked()) {
      this.handleUnformatValue();
    }
  }

  input(value: string): void {
    this.value = value;
    this.onChange(value);
  }

  blur(): void {
    this.onTouch();
    if (this.isInputMasked()) {
      this.handleFormatValue(this.value);
    }
  }

  private handleFormatValue(value: string | null): void {
    if (value !== null && this.formatInput?.formatValue && this.elementRef?.nativeElement) {
      this.elementRef.nativeElement.value = this.formatInput.formatValue(value);
    }
    this.cdr.markForCheck();
  }

  private handleUnformatValue(value: string = this.elementRef.nativeElement.value): void {
    if (value && this.formatInput?.unformatValue && this.elementRef?.nativeElement) {
      this.value = this.formatInput.unformatValue(value);
      this.elementRef.nativeElement.value = this.value;
    }
    this.cdr.markForCheck();
  }
}
