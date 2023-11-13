import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostBinding, Input } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

@Component({
  selector: 'ix-button-group',
  templateUrl: './ix-button-group.component.html',
  styleUrls: ['./ix-button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxButtonGroupComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() options: Observable<Option[]>;
  @Input() vertical = false;
  @HostBinding('class.inlineFields')
  @Input() inlineFields = false;

  isDisabled = false;
  value: string;

  constructor(
    public controlDirective: NgControl,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  onChange: (value: string) => void = (): void => {};
  onTouch: () => void = (): void => {};

  writeValue(value: string): void {
    this.value = value;
    this.cdr.markForCheck();
  }

  registerOnChange(onChange: (value: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onValueChanged(event: MatButtonToggleChange): void {
    this.value = event.value as string;
    this.onChange(event.value);
  }
}
