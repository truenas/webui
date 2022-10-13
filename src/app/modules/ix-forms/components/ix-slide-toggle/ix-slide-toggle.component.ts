import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-slide-toggle',
  styleUrls: ['./ix-slide-toggle.component.scss'],
  templateUrl: './ix-slide-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxSlideToggleComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  isDisabled = false;
  value: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: boolean) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: boolean): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: boolean) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onSlideToggleChanged(event: MatSlideToggleChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
