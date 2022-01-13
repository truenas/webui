import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, FormControl, NgControl,
} from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

type IxSelectValue = string | number | string[] | number[];

@UntilDestroy()
@Component({
  selector: 'ix-select',
  styleUrls: ['./ix-select.component.scss'],
  templateUrl: './ix-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSelectComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() value: IxSelectValue;
  @Input() hint: string;
  @Input() options: Observable<Option[]>;
  @Input() required: boolean;
  @Input() tooltip: string;
  @Input() multiple: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  formControl = new FormControl(this).value as FormControl;
  isDisabled = false;

  onChange: (value: IxSelectValue) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(val: IxSelectValue): void {
    this.value = val;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: IxSelectValue) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }
}
