import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { isValid } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { invalidDate } from 'app/constants/invalid-date';
import { formatDistanceToNowShortened } from 'app/helpers/format-distance-to-now-shortened';
import { translated } from 'app/helpers/translated.helper';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { RelativeDateTickerService } from 'app/modules/dates/services/relative-date-ticker.service';
import { LocaleService } from 'app/modules/language/locale.service';

/**
 * The "time ago" label this cell shows, as a plain function.
 *
 * Also used by `ix-table-details-row`, which prints a hidden relative-date column as text and
 * cannot reach the cell — the two must read the same or the same value would say different things
 * depending on whether its column is showing.
 */
export function formatRelativeDateValue(value: unknown, translate: TranslateService): string {
  if (!value) {
    return translate.instant('N/A');
  }
  return isValid(value) ? formatDistanceToNowShortened(value as number) : (value as string);
}

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
  imports: [TnTooltipDirective, TnTestIdDirective],
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

  /**
   * Clock dependency for `date`. The value is a fixed timestamp — a finished job's
   * `time_finished` never changes — and `tn-table` reuses this cell across reloads via
   * `trackBy`, so a `computed` keyed on `value()` alone would resolve once and leave the
   * cell reading "1 min. ago" forever. Reading the shared ticker re-derives it as time
   * passes, which the `ix-cell-relative-date` this replaces only managed on a refetch.
   */
  private readonly tick = toSignal(inject(RelativeDateTickerService).tick$, { initialValue: 0 });

  /**
   * Date/time format dependency for `tooltip`. The pipe is impure, so templates using it as a
   * pipe re-run anyway; a `computed` calling `transform()` has to take the dependency itself.
   * Read from the pipe rather than re-derived from the NgRx action that happens to drive it
   * today — what invalidates a format is the pipe's business, so this can't go stale if the
   * preference ever starts changing through another path.
   */
  private readonly dateTimeFormat = this.formatDateTime.formatChanged;

  protected readonly testId = computed(() => [this.title(), this.uniqueRowTag(), 'row-relative-date']);

  protected readonly date = translated<string>(() => {
    const value = this.value();
    if (value && isValid(value)) {
      // Depends on *now*, not just on `value` — take the clock dependency explicitly. Only on
      // this branch: "N/A" and an already-formatted invalid date do not age.
      this.tick();
    }
    return formatRelativeDateValue(value, this.translate);
  });

  protected readonly isInvalidDate = computed(
    () => this.translate.instant(this.date()) === this.translate.instant(invalidDate),
  );

  protected readonly tooltip = translated<string>(() => {
    const value = this.value();
    if (!value) {
      return this.translate.instant('N/A');
    }

    if (!isValid(value)) {
      return value as string;
    }

    // The formatted timestamps below depend on the user's date/time preference, not only
    // on `value` — take that dependency explicitly, as `date` does with the clock.
    this.dateTimeFormat();

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
