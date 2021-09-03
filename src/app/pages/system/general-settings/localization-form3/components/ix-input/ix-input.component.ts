import {
  Component, EventEmitter, forwardRef, Input, Output,
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
      useExisting: forwardRef(() => IxInput),
      multi: true,
    },
  ],
})
export class IxInput implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixText: string;
  @Input() suffixIcon: string;
  @Output() suffixIconClick: EventEmitter<MouseEvent> = new EventEmitter();
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  formControl = new FormControl(this).value as FormControl;

  value: string | number = '';
  touched = false;

  onChange: any = (): void => {};
  onTouched: any = (): void => {};

  suffixIconClicked(evt: MouseEvent): void {
    this.suffixIconClick.emit(evt);
  }

  writeValue(value: string | number): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }
}
