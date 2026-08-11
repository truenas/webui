import { CdkDragDrop, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { DualListBoxComponent } from './dual-listbox.component';

type ListSide = 'available' | 'selected';
type DropEvent = CdkDragDrop<Record<string, unknown>[]>;

describe('DualListBoxComponent', () => {
  let spectator: Spectator<DualListBoxComponent>;
  let loader: HarnessLoader;

  const testData: Record<string, unknown>[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const createComponent = createComponentFactory<DualListBoxComponent>({
    component: DualListBoxComponent,
  });

  const getSearchFields = (): Promise<TnInputHarness[]> => loader.getAllHarnesses(TnInputHarness);

  const itemsIn = (side: ListSide): HTMLElement[] => spectator.queryAll<HTMLElement>(`#${side}-list tn-list-item`);
  const namesIn = (side: ListSide): string[] => itemsIn(side).map((item) => item.textContent.trim());
  const selectedNamesIn = (side: ListSide): string[] => itemsIn(side)
    .filter((item) => item.getAttribute('aria-selected') === 'true')
    .map((item) => item.textContent.trim());

  const clickItem = (side: ListSide, index: number, modifiers: Partial<MouseEventInit> = {}): void => {
    itemsIn(side)[index].dispatchEvent(new MouseEvent('click', { bubbles: true, ...modifiers }));
    spectator.detectChanges();
  };

  const pressKey = (side: ListSide, index: number, key: string, modifiers: Partial<KeyboardEventInit> = {}): void => {
    itemsIn(side)[index].dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers }));
    spectator.detectChanges();
  };

  const getButton = (name: string): Promise<TnIconButtonHarness> => loader.getHarness(
    TnIconButtonHarness.with({ name }),
  );

  beforeEach(() => {
    spectator = createComponent({
      props: {
        sourceName: 'Available Items',
        targetName: 'Selected Items',
        source: testData,
        destination: [],
        key: 'id',
        display: 'name',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should display source and target names correctly', () => {
    const titles = spectator.queryAll('.listbox-title');
    expect(titles[0]).toContainText('Available Items');
    expect(titles[1]).toContainText('Selected Items');
  });

  // `.tn-list-item__leading` is internal library markup, selected on here only because
  // @truenas/ui-components 0.4.7 ships no TnListHarness / TnListItemHarness — see library
  // gap 8 in TRUENAS_UI_INTEGRATION.md. Replace this query with the harness once one
  // exists; it is the last `.tn-list-item__` reference outside `mixins/tn-list.scss`,
  // hence the lone `no-restricted-syntax` exemption.
  it('should render the item icon in the list item leading slot when listItemIcon is set', () => {
    spectator.setInput('listItemIcon', 'account');
    spectator.detectChanges();

    // eslint-disable-next-line no-restricted-syntax
    expect(spectator.queryAll('tn-list-item .tn-list-item__leading tn-icon')).toHaveLength(testData.length);
  });

  it('should initialize with all items in available list', () => {
    expect(namesIn('available')).toEqual(['Item 1', 'Item 2', 'Item 3']);
    expect(namesIn('selected')).toEqual([]);
  });

  it('should select an item when clicked', () => {
    clickItem('available', 0);

    expect(selectedNamesIn('available')).toEqual(['Item 1']);
  });

  it('should replace the selection on a plain click, so multi-select needs Ctrl or Shift', () => {
    clickItem('available', 0, { ctrlKey: true });
    clickItem('available', 1, { ctrlKey: true });
    expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2']);

    clickItem('available', 2);

    expect(selectedNamesIn('available')).toEqual(['Item 3']);
  });

  it('should toggle selection with Ctrl key', () => {
    clickItem('available', 0);
    expect(selectedNamesIn('available')).toEqual(['Item 1']);

    // Ctrl-click item 1 - add to selection
    clickItem('available', 1, { ctrlKey: true });
    expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2']);

    // Ctrl-click item 0 again - remove from selection
    clickItem('available', 0, { ctrlKey: true });
    expect(selectedNamesIn('available')).toEqual(['Item 2']);
  });

  it('should select range with Shift key', () => {
    clickItem('available', 0);
    clickItem('available', 2, { shiftKey: true });

    expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  it('should move selected items from available to selected', async () => {
    clickItem('available', 0);

    await (await getButton('chevron-right')).click();
    spectator.detectChanges();

    expect(namesIn('selected')).toEqual(['Item 1']);
    expect(namesIn('available')).toEqual(['Item 2', 'Item 3']);
  });

  it('should move selected items from selected to available', async () => {
    spectator.setInput('destination', [testData[0]]);
    spectator.detectChanges();

    clickItem('selected', 0);

    await (await getButton('chevron-left')).click();
    spectator.detectChanges();

    expect(namesIn('available')).toEqual(['Item 1', 'Item 2', 'Item 3']);
    expect(namesIn('selected')).toEqual([]);
  });

  it('should move all items from available to selected', async () => {
    await (await getButton('chevron-double-right')).click();
    spectator.detectChanges();

    expect(namesIn('available')).toEqual([]);
    expect(namesIn('selected')).toEqual(['Item 1', 'Item 2', 'Item 3']);
  });

  it('should move all items from selected to available', async () => {
    spectator.setInput('destination', testData);
    spectator.detectChanges();

    await (await getButton('chevron-double-left')).click();
    spectator.detectChanges();

    expect(namesIn('available')).toEqual(['Item 1', 'Item 2', 'Item 3']);
    expect(namesIn('selected')).toEqual([]);
  });

  it('should disable move buttons when there is no selection', async () => {
    expect(await (await getButton('chevron-right')).isDisabled()).toBe(true);
    expect(await (await getButton('chevron-left')).isDisabled()).toBe(true);
  });

  it('should enable move right button when items are selected in available list', async () => {
    clickItem('available', 0);

    expect(await (await getButton('chevron-right')).isDisabled()).toBe(false);
  });

  it('should update destination model when items are moved', async () => {
    clickItem('available', 0);

    await (await getButton('chevron-right')).click();
    spectator.detectChanges();

    expect(spectator.component.destination()).toEqual([{ id: 1, name: 'Item 1' }]);
  });

  it('should display custom icon when listItemIcon is provided', () => {
    spectator.setInput('listItemIcon', 'mdi-account');
    spectator.detectChanges();

    const icons = spectator.queryAll('tn-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should show keyboard shortcut hint', () => {
    const hint = spectator.query('.hint');
    expect(hint).toContainText('You can select multiple items with');
    expect(hint).toContainText('start typing to jump to one');
  });

  describe('Search', () => {
    it('should render a search field above each list', async () => {
      const searchFields = await getSearchFields();

      expect(searchFields).toHaveLength(2);
      expect(await searchFields[0].getAriaLabel()).toBe('Search Available Items');
      expect(await searchFields[1].getAriaLabel()).toBe('Search Selected Items');
    });

    it('should filter the available list by the search query', async () => {
      const [availableSearch] = await getSearchFields();
      await availableSearch.setValue('item 2');
      spectator.detectChanges();

      expect(namesIn('available')).toEqual(['Item 2']);
    });

    it('should show how many items are shown out of the total while filtering', async () => {
      const [availableSearch] = await getSearchFields();
      await availableSearch.setValue('Item 2');
      spectator.detectChanges();

      expect(spectator.queryAll('.listbox-count')[0]).toHaveText('1 of 3');
    });

    it('should show a message when nothing matches the search query', async () => {
      const [availableSearch] = await getSearchFields();
      await availableSearch.setValue('nothing matches this');
      spectator.detectChanges();

      expect(spectator.queryAll('.no-matches')[0]).toHaveText('No matches found.');
    });

    it('should only move the items matching the search when Move All is used', async () => {
      const [availableSearch] = await getSearchFields();
      await availableSearch.setValue('Item 3');
      spectator.detectChanges();

      await (await getButton('chevron-double-right')).click();
      spectator.detectChanges();

      expect(namesIn('selected')).toEqual(['Item 3']);
      // Nothing matches the query anymore, but the two unmatched items stayed put.
      expect(spectator.queryAll('.listbox-count')[0]).toHaveText('0 of 2');
    });

    it('should not move a selected item that the search hides, but keeps it selected', async () => {
      clickItem('available', 0);

      const [availableSearch] = await getSearchFields();
      await availableSearch.setValue('Item 3');
      spectator.detectChanges();

      // Item 1 is selected but off screen, so there is nothing left to move.
      expect(await (await getButton('chevron-right')).isDisabled()).toBe(true);

      // Widening the search brings the item, and the selection it kept, back into view.
      await availableSearch.setValue('Item');
      spectator.detectChanges();

      expect(selectedNamesIn('available')).toEqual(['Item 1']);
      expect(await (await getButton('chevron-right')).isDisabled()).toBe(false);
    });

    it('should not render search fields when searchable is false', async () => {
      spectator.setInput('searchable', false);
      spectator.detectChanges();

      expect(await getSearchFields()).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    const unsortedData = [
      { id: 3, name: 'Zebra' },
      { id: 1, name: 'Apple' },
      { id: 2, name: 'Banana' },
    ];

    it('should sort items when sort is enabled', () => {
      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', true);
      spectator.detectChanges();

      expect(namesIn('available')).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    it('should not sort items when sort is disabled', () => {
      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', false);
      spectator.detectChanges();

      expect(namesIn('available')).toEqual(['Zebra', 'Apple', 'Banana']);
    });

    it('should reverse the sort order when the sort toggle is clicked', async () => {
      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', true);
      spectator.detectChanges();

      await (await getButton('mdi-sort-alphabetical-ascending')).click();
      spectator.detectChanges();

      expect(namesIn('available')).toEqual(['Zebra', 'Banana', 'Apple']);
    });

    it('should not render sort toggles when sort is disabled', () => {
      expect(spectator.queryAll('.listbox-header tn-icon-button')).toHaveLength(0);

      spectator.setInput('sort', true);
      spectator.detectChanges();

      expect(spectator.queryAll('.listbox-header tn-icon-button')).toHaveLength(2);
    });
  });

  describe('Keyboard navigation', () => {
    it('should move the selection down with the arrow keys', () => {
      clickItem('available', 0);

      pressKey('available', 0, 'ArrowDown');

      expect(selectedNamesIn('available')).toEqual(['Item 2']);
    });

    it('should extend the selection with Shift and the arrow keys', () => {
      clickItem('available', 0);

      pressKey('available', 0, 'ArrowDown', { shiftKey: true });

      expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2']);
    });

    it('should jump to the last item with End and the first with Home', () => {
      pressKey('available', 0, 'End');
      expect(selectedNamesIn('available')).toEqual(['Item 3']);

      pressKey('available', 2, 'Home');
      expect(selectedNamesIn('available')).toEqual(['Item 1']);
    });

    it('should toggle the selection with the space key', () => {
      pressKey('available', 0, ' ');
      expect(selectedNamesIn('available')).toEqual(['Item 1']);

      pressKey('available', 1, ' ');
      expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2']);

      pressKey('available', 0, ' ');
      expect(selectedNamesIn('available')).toEqual(['Item 2']);
    });

    it('should move focus to the first item matching what is typed', () => {
      spectator.setInput('source', [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Blueberry' },
      ]);
      spectator.detectChanges();

      pressKey('available', 0, 'b');
      expect(itemsIn('available')[1]).toBe(document.activeElement);

      pressKey('available', 1, 'l');
      expect(itemsIn('available')[2]).toBe(document.activeElement);
    });

    it('should keep the existing selection when typing to jump to an item', () => {
      clickItem('available', 0);
      clickItem('available', 1, { ctrlKey: true });

      pressKey('available', 1, 'i');

      expect(selectedNamesIn('available')).toEqual(['Item 1', 'Item 2']);
    });

    it('should keep a single tab stop that follows the active item', () => {
      const tabIndexes = (side: ListSide): string[] => itemsIn(side).map((item) => item.getAttribute('tabindex'));

      expect(tabIndexes('available')).toEqual(['0', '-1', '-1']);

      pressKey('available', 0, 'ArrowDown');

      expect(tabIndexes('available')).toEqual(['-1', '0', '-1']);
    });
  });

  describe('Drag and Drop', () => {
    const drop = (side: ListSide, event: DropEvent): void => {
      spectator.triggerEventHandler(`#${side}-list`, 'cdkDropListDropped', event);
      spectator.detectChanges();
    };

    it('should connect both lists to each other, so an item can be dragged across', () => {
      const group = spectator.query(CdkDropListGroup, { read: CdkDropListGroup });

      expect(group._items.size).toBe(2);
    });

    it('should handle drag and drop within the same list', () => {
      drop('available', {
        previousContainer: { id: 'available-list' },
        container: { id: 'available-list' },
        previousIndex: 0,
        currentIndex: 2,
      } as DropEvent);

      expect(namesIn('available')).toEqual(['Item 2', 'Item 3', 'Item 1']);
    });

    it('should handle drag and drop from available to selected list', () => {
      drop('selected', {
        previousContainer: { id: 'available-list' },
        container: { id: 'selected-list' },
        previousIndex: 0,
        currentIndex: 0,
      } as DropEvent);

      expect(namesIn('available')).toEqual(['Item 2', 'Item 3']);
      expect(namesIn('selected')).toEqual(['Item 1']);
    });

    it('should handle drag and drop from selected to available list', () => {
      spectator.setInput('destination', [testData[0]]);
      spectator.detectChanges();

      drop('available', {
        previousContainer: { id: 'selected-list' },
        container: { id: 'available-list' },
        previousIndex: 0,
        currentIndex: 0,
      } as DropEvent);

      expect(namesIn('available')).toEqual(['Item 1', 'Item 2', 'Item 3']);
      expect(namesIn('selected')).toEqual([]);
    });

    it('should keep following the source input after a drag', () => {
      drop('selected', {
        previousContainer: { id: 'available-list' },
        container: { id: 'selected-list' },
        previousIndex: 0,
        currentIndex: 0,
      } as DropEvent);

      spectator.setInput('source', [testData[0], testData[1]]);
      spectator.detectChanges();

      expect(namesIn('available')).toEqual(['Item 2']);
    });

    it('should update destination after drag and drop', () => {
      drop('selected', {
        previousContainer: { id: 'available-list' },
        container: { id: 'selected-list' },
        previousIndex: 1,
        currentIndex: 0,
      } as DropEvent);

      expect(spectator.component.destination()).toEqual([testData[1]]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source list', async () => {
      spectator.setInput('source', []);
      spectator.detectChanges();

      expect(namesIn('available')).toEqual([]);
      expect(await (await getButton('chevron-double-right')).isDisabled()).toBe(true);
    });

    it('should handle empty destination list', async () => {
      spectator.setInput('destination', []);
      spectator.detectChanges();

      expect(namesIn('selected')).toEqual([]);
      expect(await (await getButton('chevron-double-left')).isDisabled()).toBe(true);
    });

    it('should handle all items in destination', () => {
      spectator.setInput('destination', testData);
      spectator.detectChanges();

      expect(namesIn('available')).toEqual([]);
      expect(namesIn('selected')).toEqual(['Item 1', 'Item 2', 'Item 3']);
    });

    it('should handle Enter key on item', () => {
      pressKey('available', 0, 'Enter');

      expect(selectedNamesIn('available')).toEqual(['Item 1']);
    });

    it('should ignore keys that are neither navigation nor printable', () => {
      pressKey('available', 0, 'Escape');

      expect(selectedNamesIn('available')).toEqual([]);
    });
  });

  describe('Custom key and display properties', () => {
    it('should use custom key property', () => {
      const customData = [
        { uuid: 'a1', label: 'First' },
        { uuid: 'a2', label: 'Second' },
      ];

      // Create a new component with custom key/display from the start
      const customSpectator = createComponent({
        props: {
          sourceName: 'Available Items',
          targetName: 'Selected Items',
          source: customData,
          destination: [],
          key: 'uuid',
          display: 'label',
        },
      });

      const displayText = customSpectator.queryAll('tn-list-item label');
      expect(displayText).toHaveLength(2);
      expect(displayText[0]).toHaveText('First');
      expect(displayText[1]).toHaveText('Second');
    });

    it('should throw error for invalid key property', () => {
      const invalidData = [{ name: 'Item' }];

      expect(() => {
        createComponent({
          props: {
            sourceName: 'Available Items',
            targetName: 'Selected Items',
            source: invalidData,
            destination: [],
            key: 'invalidKey',
            display: 'name',
          },
        });
      }).toThrow('DualListBox: key property "invalidKey" not found in source items. Available properties: name');
    });

    it('should throw error for invalid display property', () => {
      const invalidData = [{ id: 1 }];

      expect(() => {
        createComponent({
          props: {
            sourceName: 'Available Items',
            targetName: 'Selected Items',
            source: invalidData,
            destination: [],
            key: 'id',
            display: 'invalidDisplay',
          },
        });
      }).toThrow('DualListBox: display property "invalidDisplay" not found in source items. Available properties: id');
    });
  });

  describe('Accessibility', () => {
    it('should announce moves to screen readers and clear the announcement afterwards', async () => {
      clickItem('available', 0);

      // Clicked through the DOM rather than the harness: a harness click waits for the
      // fixture to go stable, which outlives the announcement's own one-second timeout.
      spectator.click('button[aria-label="Move selected items to the right side list"]');
      spectator.detectChanges();

      const liveRegion = spectator.query('[role="status"][aria-live="polite"]');
      expect(liveRegion).toHaveText('Moved 1 item to Selected Items');

      await new Promise((resolve) => {
        setTimeout(resolve, 1100);
      });
      spectator.detectChanges();

      expect(liveRegion).toHaveText('');
    });

    it('should expose each list as a multi-selectable listbox', () => {
      const lists = spectator.queryAll('tn-list');

      expect(lists[0].getAttribute('role')).toBe('listbox');
      expect(lists[0].getAttribute('aria-multiselectable')).toBe('true');
      expect(lists[0].getAttribute('aria-label')).toBe('Available Items');
      expect(lists[1].getAttribute('role')).toBe('listbox');
      expect(lists[1].getAttribute('aria-label')).toBe('Selected Items');
    });

    it('should expose the selection state of every item', () => {
      expect(itemsIn('available').map((item) => item.getAttribute('role'))).toEqual(['option', 'option', 'option']);
      expect(itemsIn('available').map((item) => item.getAttribute('aria-selected')))
        .toEqual(['false', 'false', 'false']);

      clickItem('available', 1);

      expect(itemsIn('available').map((item) => item.getAttribute('aria-selected')))
        .toEqual(['false', 'true', 'false']);
    });
  });
});
