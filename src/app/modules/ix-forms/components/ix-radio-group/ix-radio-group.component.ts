import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl,
} from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { RadioOption } from 'app/interfaces/option.interface';

@UntilDestroy()
@Component({
  selector: 'ix-radio-group',
  styleUrls: ['./ix-radio-group.component.scss'],
  templateUrl: './ix-radio-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxRadioGroupComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;
  @Input() options: Observable<RadioOption[]>;

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

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  onRadiosChanged(event: MatRadioChange): void {
    this.value = event.value;
    this.onChange(event.value);
  }
}
