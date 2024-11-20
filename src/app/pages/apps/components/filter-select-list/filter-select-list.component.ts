import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

type SelectListValue = string | number | (string | number)[];

@UntilDestroy()
@Component({
  selector: 'ix-filter-select-list',
  styleUrls: ['./filter-select-list.component.scss'],
  templateUrl: './filter-select-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    IxErrorsComponent,
    TranslateModule,
  ],
})
export class FilterSelectListComponent implements ControlValueAccessor {
  label = input<string>();
  options = input<Option[]>();
  multiple = input<boolean>();

  isDisabled = false;
  value: SelectListValue;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: SelectListValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: SelectListValue): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: SelectListValue) => void): void {
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
    if (!this.multiple()) {
      return this.value === value;
    }
    return (this.value as (number | string)[]).includes(value);
  }

  onItemChanged(value: Option['value']): void {
    if (!this.multiple()) {
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
