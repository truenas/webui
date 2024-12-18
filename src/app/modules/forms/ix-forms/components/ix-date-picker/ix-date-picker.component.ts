import {
  Component, ChangeDetectionStrategy, input, signal,
} from '@angular/core';
import { ControlValueAccessor, NgControl, ReactiveFormsModule } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatHint, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxDateAdapter } from 'app/modules/dates/services/ix-date-adapter';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { LocaleService } from 'app/services/locale.service';

type OnChangeFn = (value: Date) => void;
type OnTouchedFn = () => void;

@Component({
  standalone: true,
  selector: 'ix-datepicker',
  templateUrl: './ix-date-picker.component.html',
  styleUrls: ['./ix-date-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxErrorsComponent,
    IxLabelComponent,
    MatDatepickerModule,
    MatHint,
    MatInput,
    ReactiveFormsModule,
    TestDirective,
    TestOverrideDirective,
    TranslateModule,
    MatSuffix,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
  providers: [
    FormatDateTimePipe,
    {
      provide: DateAdapter,
      useClass: IxDateAdapter,
    },
  ],
})
export class IxDatepickerComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly placeholder = input<string>();
  readonly hint = input<string>();
  readonly tooltip = input<string>();
  readonly required = input(false);
  readonly readonly = input(false);

  /**
   * Specified in machine timezone.
   */
  readonly min = input<Date>();
  readonly max = input<Date>();

  protected isDisabled = signal(false);

  protected value = signal<Date>(this.controlDirective.value as Date);

  private onChange: OnChangeFn = () => {};
  private onTouched: OnTouchedFn = () => {};

  constructor(
    protected controlDirective: NgControl,
    private locale: LocaleService,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  registerOnChange(onChange: OnChangeFn): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: OnTouchedFn): void {
    this.onTouched = onTouched;
  }

  writeValue(value: Date): void {
    const dateInMachineTimezone = utcToZonedTime(value, this.locale.timezone);
    this.value.set(dateInMachineTimezone);
  }

  blurred(): void {
    this.onTouched();
  }

  onDateChanged(event: MatDatepickerInputEvent<Date>): void {
    this.value.set(event.value);
    const dateInUtc = zonedTimeToUtc(event.value, this.locale.timezone);
    this.onChange(dateInUtc);
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
