import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface HarborTimeRangeValue {
  from: string;
  to: string;
}

@Component({
  selector: 'ix-harbor-time-range-dialog',
  template: `
    <h2 mat-dialog-title>{{ 'Time range' | translate }}</h2>
    <mat-dialog-content class="time-range-dialog-content">
      <form class="time-range-dialog-form" [formGroup]="form">
        <div class="preset-row">
          <button mat-button type="button" (click)="setPreset('today')">{{ 'Today' | translate }}</button>
          <button mat-button type="button" (click)="setPreset('last24')">{{ 'Last 24 hours' | translate }}</button>
          <button mat-button type="button" (click)="setPreset('last7')">{{ 'Last 7 days' | translate }}</button>
          <button mat-button type="button" (click)="resetForm()">{{ 'All time' | translate }}</button>
        </div>

        <section class="time-boundary">
          <h3>{{ 'Start time' | translate }}</h3>
          <div class="time-picker-grid">
            <label>
              <span>{{ 'Year' | translate }}</span>
              <select formControlName="fromYear">
                <option value="">{{ 'Year' | translate }}</option>
                @for (year of years; track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Month' | translate }}</span>
              <select formControlName="fromMonth">
                <option value="">{{ 'Month' | translate }}</option>
                @for (month of months; track month) {
                  <option [value]="month">{{ month }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Day' | translate }}</span>
              <select formControlName="fromDay">
                <option value="">{{ 'Day' | translate }}</option>
                @for (day of days; track day) {
                  <option [value]="day">{{ day }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Hour' | translate }}</span>
              <select formControlName="fromHour">
                <option value="">{{ 'Hour' | translate }}</option>
                @for (hour of hours; track hour) {
                  <option [value]="hour">{{ hour }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Minute' | translate }}</span>
              <select formControlName="fromMinute">
                <option value="">{{ 'Minute' | translate }}</option>
                @for (minute of minutes; track minute) {
                  <option [value]="minute">{{ minute }}</option>
                }
              </select>
            </label>
          </div>
        </section>

        <section class="time-boundary">
          <h3>{{ 'End time' | translate }}</h3>
          <div class="time-picker-grid">
            <label>
              <span>{{ 'Year' | translate }}</span>
              <select formControlName="toYear">
                <option value="">{{ 'Year' | translate }}</option>
                @for (year of years; track year) {
                  <option [value]="year">{{ year }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Month' | translate }}</span>
              <select formControlName="toMonth">
                <option value="">{{ 'Month' | translate }}</option>
                @for (month of months; track month) {
                  <option [value]="month">{{ month }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Day' | translate }}</span>
              <select formControlName="toDay">
                <option value="">{{ 'Day' | translate }}</option>
                @for (day of days; track day) {
                  <option [value]="day">{{ day }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Hour' | translate }}</span>
              <select formControlName="toHour">
                <option value="">{{ 'Hour' | translate }}</option>
                @for (hour of hours; track hour) {
                  <option [value]="hour">{{ hour }}</option>
                }
              </select>
            </label>
            <label>
              <span>{{ 'Minute' | translate }}</span>
              <select formControlName="toMinute">
                <option value="">{{ 'Minute' | translate }}</option>
                @for (minute of minutes; track minute) {
                  <option [value]="minute">{{ minute }}</option>
                }
              </select>
            </label>
          </div>
        </section>

        @if (error) {
          <p class="time-range-error">{{ error | translate }}</p>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="clear()">{{ 'Clear' | translate }}</button>
      <button mat-button type="button" (click)="close()">{{ 'Cancel' | translate }}</button>
      <button mat-flat-button color="primary" type="button" (click)="apply()">{{ 'Apply' | translate }}</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .time-range-dialog-content {
      min-width: min(720px, 88vw);
    }

    .time-range-dialog-form {
      display: grid;
      gap: 20px;
      padding-top: 4px;
    }

    .preset-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .time-boundary {
      display: grid;
      gap: 10px;
    }

    h3 {
      font-size: 16px;
      font-weight: 700;
      margin: 0;
    }

    .time-picker-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: minmax(96px, 1.2fr) repeat(4, minmax(78px, 1fr));
    }

    label {
      color: var(--fg2);
      display: grid;
      font-size: 12px;
      gap: 4px;
    }

    select {
      appearance: none;
      background: var(--bg1);
      border: 1px solid var(--lines);
      border-radius: 8px;
      color: var(--fg1);
      font-size: 16px;
      min-height: 42px;
      min-width: 0;
      padding: 0 12px;
      width: 100%;
    }

    select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 18%, transparent);
      outline: none;
    }

    .time-range-error {
      color: var(--red);
      margin: 0;
    }

    @media (max-width: 640px) {
      .time-range-dialog-content {
        min-width: 0;
      }

      .time-picker-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
  ],
})
export class HarborTimeRangeDialogComponent {
  private readonly dialogRef = inject<MatDialogRef<HarborTimeRangeDialogComponent, HarborTimeRangeValue | null>>(MatDialogRef);
  private readonly data = inject<HarborTimeRangeValue>(MAT_DIALOG_DATA, { optional: true });
  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected error = '';
  protected readonly years = this.buildYears();
  protected readonly months = this.range(1, 12);
  protected readonly days = this.range(1, 31);
  protected readonly hours = this.range(0, 23);
  protected readonly minutes = this.range(0, 59);

  protected readonly form = this.formBuilder.group({
    fromYear: [this.part(this.data?.from ?? '', 'year')],
    fromMonth: [this.part(this.data?.from ?? '', 'month')],
    fromDay: [this.part(this.data?.from ?? '', 'day')],
    fromHour: [this.part(this.data?.from ?? '', 'hour')],
    fromMinute: [this.part(this.data?.from ?? '', 'minute')],
    toYear: [this.part(this.data?.to ?? '', 'year')],
    toMonth: [this.part(this.data?.to ?? '', 'month')],
    toDay: [this.part(this.data?.to ?? '', 'day')],
    toHour: [this.part(this.data?.to ?? '', 'hour')],
    toMinute: [this.part(this.data?.to ?? '', 'minute')],
  });

  protected apply(): void {
    this.error = '';
    const from = this.composeValue('from');
    const to = this.composeValue('to');
    if (!from.ok || !to.ok) {
      this.error = 'Choose a complete and valid time.';
      return;
    }
    if (from.value && to.value && new Date(from.value).getTime() > new Date(to.value).getTime()) {
      this.error = 'End time cannot be earlier than start time.';
      return;
    }
    this.dialogRef.close({ from: from.value, to: to.value });
  }

  protected clear(): void {
    this.dialogRef.close({ from: '', to: '' });
  }

  protected close(): void {
    this.dialogRef.close(null);
  }

  protected resetForm(): void {
    this.form.reset({
      fromYear: '',
      fromMonth: '',
      fromDay: '',
      fromHour: '',
      fromMinute: '',
      toYear: '',
      toMonth: '',
      toDay: '',
      toHour: '',
      toMinute: '',
    });
  }

  protected setPreset(preset: 'today' | 'last24' | 'last7'): void {
    const end = new Date();
    const start = new Date(end);
    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 0, 0);
    } else if (preset === 'last24') {
      start.setHours(start.getHours() - 24);
    } else {
      start.setDate(start.getDate() - 7);
    }
    this.patchBoundary('from', start);
    this.patchBoundary('to', end);
  }

  private composeValue(boundary: 'from' | 'to'): { ok: boolean; value: string } {
    const year = this.value(`${boundary}Year`);
    const month = this.value(`${boundary}Month`);
    const day = this.value(`${boundary}Day`);
    const hour = this.value(`${boundary}Hour`) || (boundary === 'from' ? '0' : '23');
    const minute = this.value(`${boundary}Minute`) || (boundary === 'from' ? '0' : '59');
    const hasDate = Boolean(year || month || day);
    const hasTime = Boolean(this.value(`${boundary}Hour`) || this.value(`${boundary}Minute`));
    if (!hasDate && !hasTime) {
      return { ok: true, value: '' };
    }
    if (!year || !month || !day) {
      return { ok: false, value: '' };
    }
    const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0);
    if (
      Number.isNaN(date.getTime())
      || date.getFullYear() !== Number(year)
      || date.getMonth() !== Number(month) - 1
      || date.getDate() !== Number(day)
    ) {
      return { ok: false, value: '' };
    }
    return {
      ok: true,
      value: `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
    };
  }

  private patchBoundary(boundary: 'from' | 'to', value: Date): void {
    this.form.patchValue({
      [`${boundary}Year`]: String(value.getFullYear()),
      [`${boundary}Month`]: String(value.getMonth() + 1),
      [`${boundary}Day`]: String(value.getDate()),
      [`${boundary}Hour`]: String(value.getHours()),
      [`${boundary}Minute`]: String(value.getMinutes()),
    });
  }

  private value(controlName: string): string {
    return String(this.form.get(controlName)?.value ?? '').trim();
  }

  private part(value: string, part: 'year' | 'month' | 'day' | 'hour' | 'minute'): string {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) {
      return '';
    }
    const index = { year: 1, month: 2, day: 3, hour: 4, minute: 5 }[part];
    return String(Number(match[index]));
  }

  private buildYears(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let year = current - 10; year <= current + 1; year++) {
      years.push(year);
    }
    return years;
  }

  private range(from: number, to: number): number[] {
    const values: number[] = [];
    for (let value = from; value <= to; value++) {
      values.push(value);
    }
    return values;
  }
}
