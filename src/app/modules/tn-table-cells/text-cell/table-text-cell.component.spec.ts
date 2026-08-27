import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnTooltipDirective } from '@truenas/ui-components';
import { TableTextCellComponent } from 'app/modules/tn-table-cells/text-cell/table-text-cell.component';

describe('TableTextCellComponent', () => {
  let spectator: Spectator<TableTextCellComponent>;

  const createComponent = createComponentFactory({
    component: TableTextCellComponent,
  });

  const cell = (): HTMLElement => spectator.query('span')!;
  const tooltip = (): string => String(spectator.query(TnTooltipDirective)!.message());

  it('renders the value', () => {
    spectator = createComponent({
      props: { value: '/mnt/tank', title: 'Path', uniqueRowTag: 'rsync-task-tank' },
    });

    expect(cell()).toHaveText('/mnt/tank');
  });

  it('composes the legacy text-prefixed test id', () => {
    spectator = createComponent({
      props: { value: '/mnt/tank', title: 'Path', uniqueRowTag: 'rsync-task-tank' },
    });

    expect(cell()).toHaveAttribute('data-test', 'text-path-rsync-task-tank-row-text');
  });

  it('uses the requested test-id suffix for the yes/no and schedule cells', () => {
    spectator = createComponent({
      props: {
        value: 'Yes', title: 'Enabled', uniqueRowTag: 'rsync-task-tank', testIdSuffix: 'row-yesno',
      },
    });

    expect(cell()).toHaveAttribute('data-test', 'text-enabled-rsync-task-tank-row-yesno');
  });

  it('renders no tooltip by default and the given one when asked', () => {
    spectator = createComponent({
      props: { value: '/mnt/tank', title: 'Path', uniqueRowTag: 'rsync-task-tank' },
    });
    expect(tooltip()).toBe('');

    spectator.setInput('tooltip', '/mnt/tank');
    expect(tooltip()).toBe('/mnt/tank');
  });
});
