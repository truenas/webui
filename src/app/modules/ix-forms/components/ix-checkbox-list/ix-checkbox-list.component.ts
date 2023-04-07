import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox-list',
  templateUrl: './ix-checkbox-list.component.html',
  styleUrls: ['./ix-checkbox-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCheckboxListComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() options: Observable<Option[]>;
  @Input() inlineFields: boolean;
  @Input() inlineFieldFlex: string;

  isDisabled = false;
  value: (string | number)[];

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  get containerLayout(): string {
    return this.inlineFields ? 'row wrap' : 'column';
  }

  get fieldFlex(): string {
    if (!this.inlineFields) {
      return '100%';
    }

    if (this.inlineFields && this.inlineFieldFlex) {
      return this.inlineFieldFlex;
    }

    return '50%';
  }

  onChange: (value: (string | number)[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: (string | number)[]): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: (string | number)[]) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  isChecked(value: string | number): boolean {
    return this.value.includes(value);
  }

  onCheckboxChanged(value: string | number): void {
    if (this.isChecked(value)) {
      this.value = this.value.filter((item) => item !== value);
    } else {
      this.value = [...this.value, value];
    }

    this.onChange(this.value);
  }
}
