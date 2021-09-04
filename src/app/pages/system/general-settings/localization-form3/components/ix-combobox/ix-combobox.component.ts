import {
  Component, EventEmitter, forwardRef, Input, Output,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-combobox',
  templateUrl: './ix-combobox.component.html',
  styleUrls: ['./ix-combobox.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IxCombobox),
      multi: true,
    },
  ],
})
export class IxCombobox implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() options: Option[];

  @Output() scrollEnd: EventEmitter<void> = new EventEmitter<void>();
  @Output() filter: EventEmitter<string> = new EventEmitter<string>();

  @Input() filteredOptions: Observable<Option[]>;

  formControl = new FormControl(this);
  value = '';
  touched = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouched: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  modelChanged(changedValue: string): void {
    this.filter.emit(changedValue);
    this.onChange(changedValue);
    this.onTouched();
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }
}
