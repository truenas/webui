import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  Input, input, signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatError, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@Component({
  standalone: true,
  selector: 'ix-datepicker',
  templateUrl: './ix-date-picker.component.html',
  styleUrls: ['./ix-date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxErrorsComponent,
    IxIconComponent,
    IxLabelComponent,
    MatDatepickerModule,
    MatHint,
    MatInput,
    MatError,
    TestDirective,
    TestOverrideDirective,
    TooltipComponent,
    TranslateModule,
    MatSuffix,
  ],
})
export class IxDatepickerComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly required = input(false);
  readonly readonly = input(false);
  readonly min = input<Date>();
  readonly max = input<Date>();

  /** If formatted value returned by parseAndFormatInput has non-numeric letters
   * and input 'type' is a number, the input will stay empty on the form */
  @Input() format: (value: string | number) => string;
  @Input() parse: (value: string | number) => string | number;

  protected isDisabled = signal(false);

  formatted: string | number = '';
  private value: string | number = this.controlDirective.value as string;
  private lastKnownValue: string | number = this.value;
  // TODO: Not wired to anything.
  invalid = false;

  onChange: (value: string | number) => void = (): void => {};
  onTouch: () => void = (): void => {};

  constructor(
    public controlDirective: NgControl,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  registerOnChange(onChange: (value: string | number) => void): void {
    this.onChange = (val) => {
      this.lastKnownValue = val;
      onChange(val);
    };
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouch = onTouched;
  }

  writeValue(value: string | number): void {
    let formatted = value;
    if (value && this.format) {
      formatted = this.format(value);
    }
    this.formatted = formatted;
    this.value = value;
    this.cdr.markForCheck();
  }

  focus(matInput: HTMLInputElement): void {
    this.onTouch();
    if (this.readonly()) {
      matInput.select();
    }
  }

  blurred(): void {
    this.onTouch();

    if (this.formatted) {
      if (this.parse) {
        this.value = this.parse(this.formatted);
        this.formatted = this.value;
      }
      if (this.format) {
        this.formatted = this.format(this.value);
      }
    }

    if (this.value !== this.lastKnownValue) {
      this.lastKnownValue = this.value;
      this.onChange(this.value);
    }

    this.cdr.markForCheck();
  }

  onDateChanged(event: MatDatepickerInputEvent<string>): void {
    this.writeValue(event.value);
    this.cdr.markForCheck();
  }

  onDateInput(event: MatDatepickerInputEvent<string>): void {
    const value = event.value;
    this.value = value;
    this.formatted = value;
    if (value && this.parse) {
      this.value = this.parse(value);
    }
    this.onChange(this.value);
    this.cdr.markForCheck();
  }

  invalidMessage(): string {
    return this.translate.instant('Value must be a valid date');
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
