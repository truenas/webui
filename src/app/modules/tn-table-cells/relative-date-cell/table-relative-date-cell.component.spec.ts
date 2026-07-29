import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnTooltipDirective } from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { fakeDate, restoreDate } from 'app/core/testing/utils/mock-clock.utils';
import { RelativeDateTickerService } from 'app/modules/dates/services/relative-date-ticker.service';
import { LocaleService } from 'app/modules/language/locale.service';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';

describe('TableRelativeDateCellComponent', () => {
  let spectator: Spectator<TableRelativeDateCellComponent>;

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let tick$: BehaviorSubject<number>;

  const createComponent = createComponentFactory({
    component: TableRelativeDateCellComponent,
    providers: [
      mockProvider(LocaleService, { timezone: browserTimezone }),
      // Drive the clock dependency by hand instead of waiting on the real 30s interval.
      mockProvider(RelativeDateTickerService, { get tick$() { return tick$; } }),
    ],
  });

  beforeEach(() => {
    tick$ = new BehaviorSubject(0);
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
});
