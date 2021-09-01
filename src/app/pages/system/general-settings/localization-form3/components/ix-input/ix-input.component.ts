import { EventEmitter } from 'events';
import { Component, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  styleUrls: ['./ix-input.component.scss'],
  templateUrl: './ix-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: IxInput,
    },
  ],
})
export class IxInput implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() value: string | number;
  @Input() prefixText: string;
  @Input() suffixIcon: string;
  @Output() suffixIconClick = new EventEmitter();
  @Input() hint: string;

  onChange = (): void => {};
  onTouched = (): void => {};

  suffixIconClicked(): void {
    this.suffixIconClick.emit('');
  }

  writeValue(val: string | number): void {
    this.value = val;
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }
}
