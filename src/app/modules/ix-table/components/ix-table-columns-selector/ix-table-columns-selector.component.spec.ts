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

  function getMenuItem(text: string): HTMLButtonElement {
    return Array.from(document.querySelectorAll<HTMLButtonElement>('.columns-menu__item'))
      .find((item) => item.textContent.trim().includes(text));
  }

  function clickMenuItem(text: string): void {
    getMenuItem(text).click();
    spectator.detectChanges();
  }

  function openMenu(): void {
    spectator.click('.columns-trigger button');
    spectator.detectChanges();
  }

  function setupComponent(
    columns: Column<unknown, ColumnComponent<unknown>>[],
    columnPreferencesKey?: string,
  ): void {
    // Tear down any previous instance so its overlay leaves the document.
    spectator?.fixture.destroy();
    spectator = createComponent({
      props: {
        columns,
        ...(columnPreferencesKey && { columnPreferencesKey }),
      },
    });
    openMenu();
  }

  beforeEach(() => {
    setupComponent(createTestColumns());
  });

  it('initializes with the correct default and hidden columns', () => {
    const hiddenColumnsTitles = spectator.component.hiddenColumns.selected.map((col) => col.title);
    const selectedColumnsTitles = spectator.component.columns().filter((col) => !col.hidden).map((col) => col.title);

    expect(hiddenColumnsTitles).toEqual(['Description']);
    expect(selectedColumnsTitles).toEqual(expect.arrayContaining(['Users', 'Command']));
  });

  it('checks when "Select All" / "Unselect All" is pressed', () => {
    const columnsChangeSpy = jest.spyOn(spectator.component.columnsChange, 'emit');

    clickMenuItem('Select All');
    expect(spectator.component.hiddenColumns.selected).toHaveLength(0);
    expect(columnsChangeSpy).toHaveBeenCalled();

    clickMenuItem('Unselect All');
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
    expect(columnsChangeSpy).toHaveBeenCalled();
  });

  it('does not affect checkbox column visibility when toggling all', () => {
    const checkboxCol = spectator.component.columns().find((col) => !col.title);
    expect(checkboxCol?.hidden).toBe(false);

    clickMenuItem('Select All');
    expect(checkboxCol?.hidden).toBe(false);

    clickMenuItem('Unselect All');
    expect(checkboxCol?.hidden).toBe(false);
  });

  it('"Reset to Defaults" is disabled initially', () => {
    jest.spyOn(spectator.component, 'resetToDefaults').mockImplementation();
    clickMenuItem('Reset to Defaults');
    expect(spectator.component.resetToDefaults).not.toHaveBeenCalled();
  });

  it('checks when "Reset to Defaults" is pressed', () => {
    clickMenuItem('Users');

    jest.spyOn(spectator.component, 'resetToDefaults').mockImplementation();
    clickMenuItem('Reset to Defaults');

    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
    expect(spectator.component.resetToDefaults).toHaveBeenCalled();
  });

  it('toggles an individual column correctly', () => {
    expect(spectator.component.hiddenColumns.selected).toHaveLength(1);

    clickMenuItem('Users');
    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);

    clickMenuItem('Description');
    expect(spectator.component.hiddenColumns.selected).toHaveLength(1);
  });

  it('saves column preferences when columnPreferencesKey is provided', () => {
    const store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');

    spectator.setInput('columnPreferencesKey', 'test-key');

    clickMenuItem('Description');

    expect(store$.dispatch).toHaveBeenCalledWith(preferredColumnsUpdated({
      tableDisplayedColumns: [{
        title: 'test-key',
        columns: ['Users', 'Command', 'Description'],
      }],
    }));
  });

  describe('keyboard accessibility', () => {
    function getMenu(): HTMLElement {
      return document.querySelector<HTMLElement>('.columns-menu');
    }

    function pressKey(key: string): void {
      getMenu().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      spectator.detectChanges();
    }

    it('moves focus between items with the arrow keys', () => {
      const items = Array.from(document.querySelectorAll<HTMLButtonElement>('.columns-menu__item'));
      items[0].focus();

      pressKey('ArrowDown');
      expect(document.activeElement).toBe(items[1]);

      pressKey('ArrowUp');
      expect(document.activeElement).toBe(items[0]);
    });

    it('exposes the visibility state through aria-checked', () => {
      const usersItem = getMenuItem('Users');
      const descriptionItem = getMenuItem('Description');

      expect(usersItem.getAttribute('aria-checked')).toBe('true');
      expect(descriptionItem.getAttribute('aria-checked')).toBe('false');
    });

    it('closes the menu when Escape is pressed', () => {
      pressKey('Escape');
      expect(spectator.component.menuOpen()).toBe(false);
    });
  });

  describe('with saved preferences', () => {
    beforeEach(() => {
      const mockStore$ = spectator.inject(MockStore);
      mockStore$.overrideSelector(selectPreferences, {
        tableDisplayedColumns: [{
          title: 'test-table',
          columns: ['Users'],
        }],
      } as Preferences);

      setupComponent(createTestColumns(), 'test-table');
    });

    it('preserves checkbox column visibility when loading saved preferences', () => {
      const checkboxCol = spectator.component.columns().find((col) => !col.title);
      expect(checkboxCol?.hidden).toBe(false);
    });

    it('enables Reset to Defaults button when preferences are loaded', () => {
      expect(getMenuItem('Reset to Defaults').disabled).toBe(false);
    });

    it('restores original column visibility when Reset to Defaults is clicked', () => {
      const commandColBefore = spectator.component.columns().find((col) => col.title === 'Command');
      expect(commandColBefore?.hidden).toBe(true);

      clickMenuItem('Reset to Defaults');

      const commandColAfter = spectator.component.columns().find((col) => col.title === 'Command');
      expect(commandColAfter?.hidden).toBe(false);

      const descriptionCol = spectator.component.columns().find((col) => col.title === 'Description');
      expect(descriptionCol?.hidden).toBe(true);
    });
  });
});
