import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, ViewContainerRef,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxFormControl, IxFormDirective } from '../ix-form/ix-form.directive';

@UntilDestroy()
@Component({
  selector: 'ix-checkbox',
  styleUrls: ['./ix-checkbox.component.scss'],
  templateUrl: './ix-checkbox.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxCheckboxComponent extends IxFormControl implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() warning: string;
  @Input() required: boolean;

  isDisabled = false;
  value: boolean;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
    elementRef: ElementRef<HTMLElement>,
    viewContainerRef: ViewContainerRef,
    ixFormDirective: IxFormDirective,
  ) {
    super(elementRef, viewContainerRef, ixFormDirective);
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

  onCheckboxChanged(event: MatCheckboxChange): void {
    this.value = event.checked;
    this.onChange(event.checked);
  }
}
