import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';

describe('IxTableColumnsSelectorComponent', () => {
  let spectator: Spectator<IxTableColumnsSelectorComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  let matDialog: MatDialog;
  const testColumns = createTable<CronjobRow>([
    textColumn({
      title: 'Users',
      propertyName: 'user',
    }),
    textColumn({
      title: 'Command',
      propertyName: 'command',
    }),
    textColumn({
      title: 'Description',
      propertyName: 'description',
      hidden: true,
    }),
    textColumn({
      title: 'Schedule',
      propertyName: 'schedule',
    }),
    yesNoColumn({
      title: 'Enabled',
      propertyName: 'enabled',
      hidden: true,
    }),
  ], {
    uniqueRowTag: (row: CronjobRow) => 'cronjob-' + row.id.toString(),
    ariaLabels: (row) => ['Column', row.id.toString()],
  }) as Column<unknown, ColumnComponent<unknown>>[];

  const createComponent = createComponentFactory({
    component: IxTableColumnsSelectorComponent,
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        columns: testColumns,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();
    await menu.open();
  });

  it('initializes with the correct default and hidden columns', () => {
    const hiddenColumnsTitles = spectator.component.hiddenColumns.selected.map((col) => col.title);
    const selectedColumnsTitles = spectator.component.columns().filter((col) => !col.hidden).map((col) => col.title);

    expect(hiddenColumnsTitles).toEqual(expect.arrayContaining(['Description', 'Enabled']));
    expect(selectedColumnsTitles).toEqual(expect.arrayContaining(['Users', 'Command', 'Schedule']));
  });

  it('checks when "Select All" / "Unselect All" is pressed', async () => {
    const columnsChangeSpy = jest.spyOn(spectator.component.columnsChange, 'emit');

    await menu.clickItem({ text: 'Select All' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(0);
    expect(columnsChangeSpy).toHaveBeenCalled();

    await menu.clickItem({ text: 'Unselect All' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(4);
    expect(columnsChangeSpy).toHaveBeenCalled();
  });

  it('"Reset to Defaults" is disabled initially', async () => {
    jest.spyOn(spectator.component, 'resetToDefaults').mockImplementation();
    await menu.clickItem({ text: 'Reset to Defaults' });
    expect(spectator.component.resetToDefaults).not.toHaveBeenCalled();
  });

  it('checks when "Reset to Defaults" is pressed', async () => {
    await menu.clickItem({ text: 'Users' });

    jest.spyOn(spectator.component, 'resetToDefaults').mockImplementation();
    await menu.clickItem({ text: 'Reset to Defaults' });

    expect(spectator.component.hiddenColumns.selected).toHaveLength(3);
    expect(spectator.component.resetToDefaults).toHaveBeenCalled();
  });

  it('toggles an individual column correctly', async () => {
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);

    await menu.clickItem({ text: 'Users' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(3);

    await menu.clickItem({ text: 'Enabled' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
  });

  it('saves column preferences when columnPreferencesKey is provided', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    spectator.setInput('columnPreferencesKey', 'test-key');

    await menu.clickItem({ text: 'Description' });

    expect(store$.dispatch).toHaveBeenCalledWith(preferredColumnsUpdated({
      tableDisplayedColumns: [{
        title: 'test-key',
        columns: ['Users', 'Command', 'Description', 'Schedule'],
      }],
    }));
  });
});
