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

type TimeBoundary = 'from' | 'to';
type TimePart = 'Year' | 'Month' | 'Day' | 'Hour' | 'Minute';
type TimeControlName = `${TimeBoundary}${TimePart}`;

@Component({
  selector: 'ix-harbor-time-range-dialog',
  templateUrl: './harbor-assistant-time-range-dialog.component.html',
  styleUrl: './harbor-assistant-time-range-dialog.component.scss',
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
  private readonly dialogRef = inject<MatDialogRef<
    HarborTimeRangeDialogComponent,
    HarborTimeRangeValue | null
  >>(MatDialogRef);

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

  private composeValue(boundary: TimeBoundary): { ok: boolean; value: string } {
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
      value: `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        + `T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
    };
  }

  private patchBoundary(boundary: TimeBoundary, value: Date): void {
    this.form.patchValue({
      [`${boundary}Year`]: String(value.getFullYear()),
      [`${boundary}Month`]: String(value.getMonth() + 1),
      [`${boundary}Day`]: String(value.getDate()),
      [`${boundary}Hour`]: String(value.getHours()),
      [`${boundary}Minute`]: String(value.getMinutes()),
    });
  }

  private value(controlName: TimeControlName): string {
    return String(this.form.controls[controlName].value).trim();
  }

  private part(value: string, part: Lowercase<TimePart>): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return '';
    }
    const index = {
      year: 1, month: 2, day: 3, hour: 4, minute: 5,
    }[part];
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
