import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import * as cronParser from 'cron-parser';
import { DayOfTheWeekRange, MonthRange } from 'cron-parser/types';
import { of } from 'rxjs';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { Option } from 'app/interfaces/option.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  SchedulerModalConfig,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal-config.interface';
import {
  CrontabPart,
  CrontabPartValidatorService,
} from 'app/modules/scheduler/services/crontab-part-validator.service';
import { getDefaultCrontabPresets } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';
import { SchedulerPreviewColumnComponent } from './scheduler-preview-column/scheduler-preview-column.component';

@UntilDestroy()
@Component({
  selector: 'ix-scheduler-modal',
  templateUrl: './scheduler-modal.component.html',
  styleUrls: ['./scheduler-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TooltipComponent,
    IxInputComponent,
    MatCheckbox,
    TestDirective,
    MatButton,
    SchedulerPreviewColumnComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SchedulerModalComponent implements OnInit {
  protected form = this.formBuilder.group({
    preset: [''],
    minutes: ['', [Validators.required, this.validators.crontabPartValidator(CrontabPart.Minutes)]],
    hours: ['', [Validators.required, this.validators.crontabPartValidator(CrontabPart.Hours)]],
    days: ['', [Validators.required, this.validators.crontabPartValidator(CrontabPart.Days)]],
    months: this.formBuilder.group<Record<string, boolean>>({}),
    weekdays: this.formBuilder.group({
      mon: [false],
      tue: [false],
      wed: [false],
      thu: [false],
      fri: [false],
      sat: [false],
      sun: [false],
    }),
  });

  crontab: string;
  timezone: string;

  // TODO: This belongs elsewhere, for example in date-fns.
  readonly months: Option[] = [
    { label: this.translate.instant('Jan'), value: '1' },
    { label: this.translate.instant('Feb'), value: '2' },
    { label: this.translate.instant('Mar'), value: '3' },
    { label: this.translate.instant('Apr'), value: '4' },
    { label: this.translate.instant('May'), value: '5' },
    { label: this.translate.instant('Jun'), value: '6' },
    { label: this.translate.instant('Jul'), value: '7' },
    { label: this.translate.instant('Aug'), value: '8' },
    { label: this.translate.instant('Sep'), value: '9' },
    { label: this.translate.instant('Oct'), value: '10' },
    { label: this.translate.instant('Nov'), value: '11' },
    { label: this.translate.instant('Dec'), value: '12' },
  ];

  // TODO: This belongs elsewhere.
  // TODO: Not every locale uses Sun as first day of the week.
  // TODO: Update in harness too.
  // TODO: Limit type.
  readonly weekdays: Option[] = [
    { label: this.translate.instant('Sun'), value: 'sun' },
    { label: this.translate.instant('Mon'), value: 'mon' },
    { label: this.translate.instant('Tue'), value: 'tue' },
    { label: this.translate.instant('Wed'), value: 'wed' },
    { label: this.translate.instant('Thu'), value: 'thu' },
    { label: this.translate.instant('Fri'), value: 'fri' },
    { label: this.translate.instant('Sat'), value: 'sat' },
  ];

  readonly presets = getDefaultCrontabPresets(this.translate);
  readonly presetOptions$ = of(this.presets);
  readonly tooltips = {
    general: helptextGlobal.scheduler.general.tooltip,
    minutes: helptextGlobal.scheduler.minutes.tooltip,
    hours: helptextGlobal.scheduler.hours.tooltip,
    days: helptextGlobal.scheduler.days.tooltip,
    orTooltip: helptextGlobal.scheduler.orTooltip,
  };

  readonly hasOrConditionExplanation$ = this.form.select((values) => {
    return !this.areAllWeekdaysSelected && values.days !== '*';
  });

  constructor(
    private dialogRef: MatDialogRef<SchedulerModalComponent>,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private validators: CrontabPartValidatorService,
    private store$: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) public config: SchedulerModalConfig,
  ) {}

  ngOnInit(): void {
    this.dialogRef.addPanelClass('scheduler-modal');
    this.generateMonthControls();
    this.setupFormSubscriptions();
    this.setInitialValues();
    this.setTimezone();
  }

  onDone(): void {
    this.dialogRef.close(this.crontab);
  }

  private setInitialValues(): void {
    if (this.config.crontab) {
      this.setValuesFromCrontab(this.config.crontab);
    } else {
      this.form.patchValue({ preset: this.presets[0].value });
    }
    this.crontab = this.getCrontabFromForm();
  }

  private setTimezone(): void {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
      this.crontab = this.getCrontabFromForm();
    });
  }

  private setupFormSubscriptions(): void {
    this.form.controls.preset.valueChanges.pipe(untilDestroyed(this)).subscribe((preset) => {
      if (!preset) {
        return;
      }

      this.setValuesFromCrontab(preset);
    });

    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.form.invalid) {
        return;
      }

      this.crontab = this.getCrontabFromForm();
      this.updatePresetToMatchCrontab();
    });
  }

  private generateMonthControls(): void {
    this.months.forEach((month) => {
      this.form.controls.months.addControl(month.value as string, new FormControl(false));
    });
  }

  private setValuesFromCrontab(crontab: string): void {
    const [minutes, hours, days] = crontab.split(' ');
    this.form.patchValue({ minutes, hours, days });
    try {
      const parsed = cronParser.parseExpression(crontab);

      const monthValues: Record<string, boolean> = {};
      this.months.forEach((month) => {
        monthValues[month.value] = parsed.fields.month.includes(Number(month.value) as MonthRange);
      });

      const weekdayNumberToWeekday = new Map<DayOfTheWeekRange, string>([
        [0, 'sun'],
        [1, 'mon'],
        [2, 'tue'],
        [3, 'wed'],
        [4, 'thu'],
        [5, 'fri'],
        [6, 'sat'],
        [7, 'sun'], // Sunday can be expressed both as 0 and 7
      ]);
      const enabledWeekdays = parsed.fields.dayOfWeek.map((weekdayNumber) => {
        return weekdayNumberToWeekday.get(weekdayNumber);
      });
      const weekdayValues: Record<string, boolean> = {};
      this.weekdays.forEach((weekday) => {
        weekdayValues[weekday.value] = enabledWeekdays.includes(weekday.value as string);
      });

      this.form.patchValue({
        months: monthValues,
        weekdays: weekdayValues,
      });
    } catch (error: unknown) {
      console.error(error);
    }
  }

  private getCrontabFromForm(): string {
    const {
      minutes, hours, days, months,
    } = this.form.value;

    const selectedMonths = Object.entries(months)
      .filter(([, isSelected]) => isSelected)
      .map(([month]) => month);
    const areAllMonthsSelected = selectedMonths.length === 0 || selectedMonths.length === 12;
    const monthsPart = areAllMonthsSelected ? '*' : selectedMonths.join(',');

    const weekdaysPart = this.areAllWeekdaysSelected ? '*' : this.selectedWeekdays.join(',');

    return [minutes, hours, days, monthsPart, weekdaysPart].join(' ');
  }

  private get selectedWeekdays(): string[] {
    return Object.entries(this.form.value.weekdays)
      .filter(([, isSelected]) => isSelected)
      .map(([weekday]) => weekday);
  }

  private get areAllWeekdaysSelected(): boolean {
    return this.selectedWeekdays.length === 0 || this.selectedWeekdays.length === 7;
  }

  private updatePresetToMatchCrontab(): void {
    const matchingPreset = this.presets.some((preset) => {
      return preset.value === this.crontab;
    });

    this.form.patchValue({ preset: matchingPreset ? this.crontab : '' }, { emitEvent: false });
  }
}
