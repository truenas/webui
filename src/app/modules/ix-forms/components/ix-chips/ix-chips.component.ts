import { ENTER } from '@angular/cdk/keycodes';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips/chip-input';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-chips',
  templateUrl: './ix-chips.component.html',
  styleUrls: ['./ix-chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxChipsComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  values: string[] = [];
  isDisabled = false;

  onChange: (value: string[]) => void = (): void => {};
  onTouch: () => void = (): void => {};

  readonly separatorKeysCodes = [ENTER];

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  writeValue(value: string[]): void {
    this.values = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: []) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  resetInput(): void {
    this.values = [];
    this.onChange(this.values);
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onRemove(itemToRemove: string): void {
    const updatedValues = this.values.filter((value) => value !== itemToRemove);
    this.updateValues(updatedValues);
  }

  onAdd(event: MatChipInputEvent): void {
    const newValue = (event.value || '').trim();
    if (!newValue || this.values.includes(newValue)) {
      return;
    }

    event.chipInput.clear();
    this.updateValues([...this.values, newValue]);
  }

  private updateValues(updatedValues: string[]): void {
    this.values = updatedValues;
    this.onChange(updatedValues);
    this.onTouch();
  }
}
