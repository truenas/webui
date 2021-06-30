import { ControlValueAccessor } from '@angular/forms';

export class ValueAccessorParent implements ControlValueAccessor {
  onChange: any = () => {};
  onTouch: any = () => {};
  val = '';

  set value(val: any) {
    if (val !== undefined && this.val !== val) {
      this.val = val;
      this.onChange(val);
      this.onTouch(val);
    }
  }

  writeValue(value: any): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }
}
