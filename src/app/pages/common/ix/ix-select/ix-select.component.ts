import {
  Component, forwardRef, Input,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => IxSelectComponent),
    },
  ],
})
export class IxSelectComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() value: string | number;
  @Input() hint: string;
  @Input() options: Observable<Option[]>;
  @Input() required: boolean;
  @Input() tooltip: string;

  formControl = new FormControl(this).value as FormControl;

  touched = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(val: string | number): void {
    this.value = val;
    this.onChange(val);
    this.onTouch();
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }
}
