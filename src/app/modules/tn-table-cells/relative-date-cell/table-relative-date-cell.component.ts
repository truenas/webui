import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { invalidDate } from 'app/constants/invalid-date';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/modules/language/locale.service';

/**
 * tn-table replacement for the ix-table `relativeDateColumn` cell renderer.
 * Renders a shortened "time ago" label with the machine/browser timestamps in
 * the tooltip, mirroring `ix-cell-relative-date` (including its `N/A` and
 * invalid-date handling) so migrated lists read identically.
 *
 * The test ID keeps the legacy `text-…-row-relative-date` shape: the host is a
 * `<span>`, which the legacy directive prefixed with `text`, so the migrated
 * markup declares the same prefix through `tnTestIdType`.
 */
@Component({
  selector: 'ix-table-relative-date-cell',
  templateUrl: './table-relative-date-cell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTooltipDirective, TnTestIdDirective, TranslateModule],
  providers: [FormatDateTimePipe],
})
export class TableRelativeDateCellComponent {
  private translate = inject(TranslateService);
  private formatDateTime = inject(FormatDateTimePipe);
  private localeService = inject(LocaleService);

  /** Raw cell value — a timestamp, a `Date`, or an already-formatted string. */
  readonly value = input.required<unknown>();
  /** Column title segment for the test ID (e.g. the translated "Last Run"). */
  readonly title = input.required<string>();
  readonly uniqueRowTag = input.required<string>();

  private readonly browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  protected readonly testId = computed(() => [this.title(), this.uniqueRowTag(), 'row-relative-date']);

  protected readonly date = computed<string>(() => {
    const value = this.value();
    if (!value) {
      return this.translate.instant('N/A');
    }

    if (isValid(value)) {
      return formatDistanceToNowShortened(value as number);
    }

    return value as string;
  });

  protected readonly isInvalidDate = computed(
    () => this.translate.instant(this.date()) === this.translate.instant(invalidDate),
  );

  protected readonly tooltip = computed<string>(() => {
    const value = this.value();
    if (!value) {
      return this.translate.instant('N/A');
    }

    if (!isValid(value)) {
      return value as string;
    }

    const machineTime = this.toMachineTime(value);
    if (!this.hasTimezoneDifference(value, machineTime)) {
      return this.formatDateTime.transform(machineTime);
    }

    return this.translate.instant('Machine Time: {machineTime} \n Browser Time: {browserTime}', {
      machineTime: this.formatDateTime.transform(machineTime),
      browserTime: this.formatDateTime.transform(value as number),
    });
  });

  private toMachineTime(value: unknown): Date {
    const utc = fromZonedTime(value as number, this.browserTimezone);
    return toZonedTime(utc, this.localeService.timezone || this.browserTimezone);
  }

  private hasTimezoneDifference(value: unknown, machineTime: Date): boolean {
    return machineTime < (value as Date) || machineTime > (value as Date);
  }
}
