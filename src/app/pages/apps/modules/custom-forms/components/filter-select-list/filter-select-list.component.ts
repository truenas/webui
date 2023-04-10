import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

type IxSelectListValue = string | number | (string | number)[];

@UntilDestroy()
@Component({
  selector: 'ix-filter-select-list',
  styleUrls: ['./filter-select-list.component.scss'],
  templateUrl: './filter-select-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterSelectListComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() options: Observable<Option[]>;
  @Input() multiple: boolean;

  isDisabled = false;
  value: IxSelectListValue;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: IxSelectListValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: IxSelectListValue): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IxSelectListValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  isChecked(value: Option['value']): boolean {
    if (!this.multiple) {
      return this.value === value;
    }
    return (this.value as (number | string)[]).includes(value);
  }

  onItemChanged(value: Option['value']): void {
    if (!this.multiple) {
      this.value = value;
    } else {
      this.value = this.value as (number | string)[];
      if (this.isChecked(value)) {
        this.value = this.value.filter((item) => item !== value);
      } else {
        this.value = [...this.value, value];
      }
    }

    this.onChange(this.value);
  }
}
