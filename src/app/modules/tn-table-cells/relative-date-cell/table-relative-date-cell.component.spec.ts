import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Actions } from '@ngrx/effects';
import { TnTooltipDirective } from '@truenas/ui-components';
import { BehaviorSubject, Subject } from 'rxjs';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { RelativeDateTickerService } from 'app/modules/dates/services/relative-date-ticker.service';
import { LocaleService } from 'app/modules/language/locale.service';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';

describe('TableRelativeDateCellComponent', () => {
  let spectator: Spectator<TableRelativeDateCellComponent>;

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let tick$: BehaviorSubject<number>;
  let actions$: Subject<unknown>;

  const createComponent = createComponentFactory({
    component: TableRelativeDateCellComponent,
    providers: [
      mockProvider(LocaleService, { timezone: browserTimezone }),
      // Drive the clock dependency by hand instead of waiting on the real 30s interval.
      mockProvider(RelativeDateTickerService, { get tick$() { return tick$; } }),
      { provide: Actions, useFactory: () => actions$ },
    ],
  });

  beforeEach(() => {
    tick$ = new BehaviorSubject(0);
    actions$ = new Subject<unknown>();
  });

  const setup = (value: unknown): void => {
    spectator = createComponent({
      props: {
        value,
        title: 'Last Run',
        uniqueRowTag: 'cloudsync-task-test',
      },
    });
  };

  const cell = (): HTMLElement => spectator.query('span')!;
  const tooltip = (): string => String(spectator.query(TnTooltipDirective)!.message);

  it('composes the legacy text-prefixed test id', () => {
    setup(new Date());
    expect(cell()).toHaveAttribute('data-test', 'text-last-run-cloudsync-task-test-row-relative-date');
  });

  it('renders a shortened distance for a valid date', () => {
    setup(new Date(Date.now() - 60 * 1000));
    expect(cell()).toHaveText('1 min. ago');
  });

  it('renders N/A when there is no value', () => {
    setup(null);
    expect(cell()).toHaveText('N/A');
    expect(tooltip()).toBe('N/A');
  });

  it('passes a non-date value through and flags it as invalid', () => {
    setup('Invalid Date');
    expect(cell()).toHaveText('Invalid Date');
    expect(cell()).toHaveClass('error');
    expect(tooltip()).toBe('Invalid Date');
  });

  it('does not flag a valid date as invalid', () => {
    setup(new Date());
    expect(cell()).not.toHaveClass('error');
  });

  // The value is a fixed timestamp that tn-table reuses across reloads, so the distance
  // has to be re-derived off the ticker — otherwise the cell freezes at its first render.
  it('advances the relative date on a ticker, without the value changing', () => {
    fakeDate(new Date('2026-01-20T00:00:00Z'));

    try {
      setup(new Date('2026-01-19T23:59:00Z'));
      expect(cell()).toHaveText('1 min. ago');

      jest.setSystemTime(new Date('2026-01-20T02:00:00Z'));
      tick$.next(1);
      spectator.detectChanges();

      expect(cell()).toHaveText('about 2 hours ago');
    } finally {
      restoreDate();
    }
  });

  it('shows both machine and browser time when the machine timezone differs', () => {
    spectator = createComponent({
      props: {
        value: new Date('2024-03-05T10:00:00Z'),
        title: 'Last Run',
        uniqueRowTag: 'cloudsync-task-test',
      },
      providers: [
        mockProvider(LocaleService, { timezone: 'Australia/Sydney' }),
      ],
    });

    expect(tooltip()).toContain('Machine Time:');
    expect(tooltip()).toContain('Browser Time:');
  });

  // The tooltip is formatted with the user's date/time preference, which FormatDateTimePipe
  // re-reads on `localizationFormSubmitted`. tn-table reuses this cell via trackBy, so the
  // `value` input never changes and the computed has to take that dependency itself.
  it('reformats the tooltip when the date/time format preference changes', () => {
    setup(new Date('2024-03-05T10:00:00Z'));
    const before = tooltip();

    localStorage.setItem('dateFormat', 'yyyy/MM/dd');
    try {
      actions$.next(localizationFormSubmitted({ dateFormat: 'yyyy/MM/dd', timeFormat: 'HH:mm:ss', language: 'en' }));
      spectator.detectChanges();

      expect(tooltip()).not.toBe(before);
      expect(tooltip()).toContain('2024/03/05');
    } finally {
      localStorage.removeItem('dateFormat');
    }
  });
});
