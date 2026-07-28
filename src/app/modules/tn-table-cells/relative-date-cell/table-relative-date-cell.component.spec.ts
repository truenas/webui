import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnTooltipDirective } from '@truenas/ui-components';
import { LocaleService } from 'app/modules/language/locale.service';
import {
  TableRelativeDateCellComponent,
} from 'app/modules/tn-table-cells/relative-date-cell/table-relative-date-cell.component';

describe('TableRelativeDateCellComponent', () => {
  let spectator: Spectator<TableRelativeDateCellComponent>;

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const createComponent = createComponentFactory({
    component: TableRelativeDateCellComponent,
    providers: [
      mockProvider(LocaleService, { timezone: browserTimezone }),
    ],
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
