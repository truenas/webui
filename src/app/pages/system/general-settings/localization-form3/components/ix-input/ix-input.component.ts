import {
  Component, EventEmitter, Input, Output,
} from '@angular/core';
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
  @Output() suffixIconClick: EventEmitter<MouseEvent> = new EventEmitter();
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  onChange = (): void => {};
  onTouched = (): void => {};

  suffixIconClicked(evt: MouseEvent): void {
    this.suffixIconClick.emit(evt);
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
