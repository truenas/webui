import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: IxSelect,
    },
  ],
})
export class IxSelect implements ControlValueAccessor {
  @Input() label: string;
  @Input() value: string | number;
  @Input() hint: string;

  onChange = (): void => {};
  onTouched = (): void => {};

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
