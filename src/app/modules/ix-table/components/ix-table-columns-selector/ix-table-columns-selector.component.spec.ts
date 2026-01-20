import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Preferences } from 'app/interfaces/preferences.interface';
import { checkboxColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-checkbox/ix-cell-checkbox.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('IxTableColumnsSelectorComponent', () => {
  let spectator: Spectator<IxTableColumnsSelectorComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;

  function createTestColumns(): Column<unknown, ColumnComponent<unknown>>[] {
    return createTable<CronjobRow>([
      checkboxColumn({
        propertyName: 'enabled',
      }),
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
    ], {
      uniqueRowTag: (row: CronjobRow) => 'cronjob-' + row.id.toString(),
      ariaLabels: (row) => ['Column', row.id.toString()],
    }) as Column<unknown, ColumnComponent<unknown>>[];
  }

  const createComponent = createComponentFactory({
    component: IxTableColumnsSelectorComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectPreferences, value: {} },
        ],
      }),
    ],
  });

  async function setupComponent(
    columns: Column<unknown, ColumnComponent<unknown>>[],
    columnPreferencesKey?: string,
  ): Promise<void> {
    spectator = createComponent({
      props: {
        columns,
        ...(columnPreferencesKey && { columnPreferencesKey }),
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    await menu.open();
  }

  beforeEach(async () => {
    await setupComponent(createTestColumns());
  });

  it('initializes with the correct default and hidden columns', () => {
    const hiddenColumnsTitles = spectator.component.hiddenColumns.selected.map((col) => col.title);
    const selectedColumnsTitles = spectator.component.columns().filter((col) => !col.hidden).map((col) => col.title);

    expect(hiddenColumnsTitles).toEqual(['Description']);
    expect(selectedColumnsTitles).toEqual(expect.arrayContaining(['Users', 'Command']));
  });

  it('checks when "Select All" / "Unselect All" is pressed', async () => {
    const columnsChangeSpy = jest.spyOn(spectator.component.columnsChange, 'emit');

    await menu.clickItem({ text: 'Select All' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(0);
    expect(columnsChangeSpy).toHaveBeenCalled();

    await menu.clickItem({ text: 'Unselect All' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
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

    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
    expect(spectator.component.resetToDefaults).toHaveBeenCalled();
  });

  it('toggles an individual column correctly', async () => {
    expect(spectator.component.hiddenColumns.selected).toHaveLength(1);

    await menu.clickItem({ text: 'Users' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);

    await menu.clickItem({ text: 'Description' });
    expect(spectator.component.hiddenColumns.selected).toHaveLength(1);
  });

  it('saves column preferences when columnPreferencesKey is provided', async () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    spectator.setInput('columnPreferencesKey', 'test-key');

    await menu.clickItem({ text: 'Description' });

    expect(store$.dispatch).toHaveBeenCalledWith(preferredColumnsUpdated({
      tableDisplayedColumns: [{
        title: 'test-key',
        columns: ['Users', 'Command', 'Description'],
      }],
    }));
  });

  describe('with saved preferences', () => {
    beforeEach(async () => {
      const mockStore$ = spectator.inject(MockStore);
      mockStore$.overrideSelector(selectPreferences, {
        tableDisplayedColumns: [{
          title: 'test-table',
          columns: ['Users'],
        }],
      } as Preferences);

      await setupComponent(createTestColumns(), 'test-table');
    });

    it('preserves checkbox column visibility when loading saved preferences', () => {
      const checkboxCol = spectator.component.columns().find((col) => !col.title);
      expect(checkboxCol?.hidden).toBeFalsy();
    });

    it('enables Reset to Defaults button when preferences are loaded', async () => {
      const resetButton = await menu.getItems({ text: 'Reset to Defaults' });
      expect(await resetButton[0].isDisabled()).toBe(false);
    });

    it('restores original column visibility when Reset to Defaults is clicked', async () => {
      // Before reset: Command should be hidden (not in saved preferences)
      const commandColBefore = spectator.component.columns().find((col) => col.title === 'Command');
      expect(commandColBefore?.hidden).toBe(true);

      // Click Reset to Defaults
      await menu.clickItem({ text: 'Reset to Defaults' });

      // After reset: Command should be visible (was visible by default)
      const commandColAfter = spectator.component.columns().find((col) => col.title === 'Command');
      expect(commandColAfter?.hidden).toBe(false);

      // Description should still be hidden (was hidden by default)
      const descriptionCol = spectator.component.columns().find((col) => col.title === 'Description');
      expect(descriptionCol?.hidden).toBe(true);
    });
  });
});
