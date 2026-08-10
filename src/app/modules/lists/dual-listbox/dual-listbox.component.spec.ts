import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnIconButtonHarness, TnInputHarness } from '@truenas/ui-components';
import { DualListBoxComponent } from './dual-listbox.component';

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
    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should select an item when clicked', () => {
    const listItems = spectator.queryAll('tn-list-item');
    spectator.click(listItems[0]);

    expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);
  });

  it('should replace the selection on a plain click, so multi-select needs Ctrl or Shift', () => {
    const listItems = spectator.queryAll('tn-list-item');

    listItems[0].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    listItems[1].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedKeys.size).toBe(2);

    spectator.click(listItems[2]);

    expect([...spectator.component.availableList().selectedKeys]).toEqual([3]);
  });

  it('should toggle selection with Ctrl key', () => {
    const listItems = spectator.queryAll('tn-list-item');

    // First click - select item 0
    spectator.click(listItems[0]);
    expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);

    // Ctrl-click item 1 - add to selection
    listItems[1].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);
    expect(spectator.component.availableList().selectedKeys.has(2)).toBe(true);

    // Ctrl-click item 0 again - remove from selection
    listItems[0].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedKeys.has(1)).toBe(false);
    expect(spectator.component.availableList().selectedKeys.has(2)).toBe(true);
  });

  it('should select range with Shift key', () => {
    const listItems = spectator.queryAll('tn-list-item');

    // First click - select item 0
    spectator.click(listItems[0]);
    expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);

    // Shift-click item 2 - select range 0-2
    listItems[2].dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    spectator.detectChanges();
    expect([...spectator.component.availableList().selectedKeys]).toEqual([1, 2, 3]);
  });

  it('should move selected items from available to selected', async () => {
    // Select first item
    const listItems = spectator.queryAll('tn-list-item');
    spectator.click(listItems[0]);

    // Click move right button
    const moveRightButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-right' }),
    );
    await moveRightButton.click();

    spectator.detectChanges();

    expect(spectator.component.selectedList().items).toHaveLength(1);
    expect(spectator.component.selectedList().items[0]).toEqual({ id: 1, name: 'Item 1' });
    expect(spectator.component.availableList().items).toHaveLength(2);
  });

  it('should move selected items from selected to available', async () => {
    // Set initial state with one item selected
    spectator.setInput('destination', [testData[0]]);
    spectator.detectChanges();

    // Select first item in selected list
    const listItems = spectator.queryAll('tn-list-item');
    const selectedListItems = listItems.slice(2); // Skip available list items
    spectator.click(selectedListItems[0]);

    // Click move left button
    const moveLeftButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-left' }),
    );
    await moveLeftButton.click();

    spectator.detectChanges();

    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should move all items from available to selected', async () => {
    const moveAllRightButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-double-right' }),
    );
    await moveAllRightButton.click();

    spectator.detectChanges();

    expect(spectator.component.availableList().items).toHaveLength(0);
    expect(spectator.component.selectedList().items).toHaveLength(3);
  });

  it('should move all items from selected to available', async () => {
    // Set initial state with all items selected
    spectator.setInput('destination', testData);
    spectator.detectChanges();

    const moveAllLeftButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-double-left' }),
    );
    await moveAllLeftButton.click();

    spectator.detectChanges();

    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should disable move buttons when there is no selection', async () => {
    const moveRightButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-right' }),
    );
    const moveLeftButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-left' }),
    );

    expect(await moveRightButton.isDisabled()).toBe(true);
    expect(await moveLeftButton.isDisabled()).toBe(true);
  });

  it('should enable move right button when items are selected in available list', async () => {
    // Select first item
    const listItems = spectator.queryAll('tn-list-item');
    spectator.click(listItems[0]);
    spectator.detectChanges();

    const moveRightButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-right' }),
    );

    expect(await moveRightButton.isDisabled()).toBe(false);
  });

  it('should update destination model when items are moved', async () => {
    // Select and move first item
    const listItems = spectator.queryAll('tn-list-item');
    spectator.click(listItems[0]);

    const moveRightButton = await loader.getHarness(
      TnIconButtonHarness.with({ name: 'chevron-right' }),
    );
    await moveRightButton.click();

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

      const listItems = spectator.queryAll('tn-list[aria-label="Available Items"] tn-list-item');
      expect(listItems).toHaveLength(1);
      expect(listItems[0]).toHaveText('Item 2');
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

      const moveAllRightButton = await loader.getHarness(
        TnIconButtonHarness.with({ name: 'chevron-double-right' }),
      );
      await moveAllRightButton.click();
      spectator.detectChanges();

      expect(spectator.component.selectedList().items).toEqual([{ id: 3, name: 'Item 3' }]);
      expect(spectator.component.availableList().items).toHaveLength(2);
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

      expect(spectator.component.availableItems().map((item) => item.name)).toEqual(['Apple', 'Banana', 'Zebra']);
    });

    it('should not sort items when sort is disabled', () => {
      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', false);
      spectator.detectChanges();

      expect(spectator.component.availableItems().map((item) => item.name)).toEqual(['Zebra', 'Apple', 'Banana']);
    });

    it('should reverse the sort order when the sort toggle is clicked', async () => {
      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', true);
      spectator.detectChanges();

      const sortButton = await loader.getHarness(
        TnIconButtonHarness.with({ name: 'mdi-sort-alphabetical-ascending' }),
      );
      await sortButton.click();
      spectator.detectChanges();

      expect(spectator.component.availableItems().map((item) => item.name)).toEqual(['Zebra', 'Banana', 'Apple']);
    });

    it('should not render sort toggles when sort is disabled', () => {
      expect(spectator.queryAll('.listbox-header tn-icon-button')).toHaveLength(0);

      spectator.setInput('sort', true);
      spectator.detectChanges();

      expect(spectator.queryAll('.listbox-header tn-icon-button')).toHaveLength(2);
    });
  });

  describe('Keyboard navigation', () => {
    const pressKey = (element: Element, key: string, modifiers: Partial<KeyboardEventInit> = {}): void => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...modifiers }));
      spectator.detectChanges();
    };

    it('should move the selection down with the arrow keys', () => {
      const listItems = spectator.queryAll('tn-list-item');
      spectator.click(listItems[0]);

      pressKey(listItems[0], 'ArrowDown');

      expect([...spectator.component.availableList().selectedKeys]).toEqual([2]);
    });

    it('should extend the selection with Shift and the arrow keys', () => {
      const listItems = spectator.queryAll('tn-list-item');
      spectator.click(listItems[0]);

      pressKey(listItems[0], 'ArrowDown', { shiftKey: true });

      expect([...spectator.component.availableList().selectedKeys]).toEqual([1, 2]);
    });

    it('should jump to the last item with End and the first with Home', () => {
      const listItems = spectator.queryAll('tn-list-item');

      pressKey(listItems[0], 'End');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([3]);

      pressKey(listItems[2], 'Home');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([1]);
    });

    it('should toggle the selection with the space key', () => {
      const listItems = spectator.queryAll('tn-list-item');

      pressKey(listItems[0], ' ');
      expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);

      pressKey(listItems[1], ' ');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([1, 2]);

      pressKey(listItems[0], ' ');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([2]);
    });

    it('should jump to the first item matching what is typed', () => {
      spectator.setInput('source', [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
        { id: 3, name: 'Blueberry' },
      ]);
      spectator.detectChanges();

      const listItems = spectator.queryAll('tn-list-item');
      pressKey(listItems[0], 'b');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([2]);

      pressKey(listItems[1], 'l');
      expect([...spectator.component.availableList().selectedKeys]).toEqual([3]);
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag and drop within the same list', () => {
      const initialItems = [...spectator.component.availableList().items];
      expect(initialItems).toHaveLength(3);

      // Simulate drag from index 0 to index 2 within available list
      const event = {
        previousContainer: { id: 'available-list' },
        container: { id: 'available-list' },
        previousIndex: 0,
        currentIndex: 2,
      } as unknown as CdkDragDrop<Record<string, unknown>[]>;

      spectator.component.onDrop(event);
      spectator.detectChanges();

      const newItems = spectator.component.availableList().items;
      expect(newItems).toHaveLength(3);
      expect(newItems[0]).toEqual(initialItems[1]);
      expect(newItems[1]).toEqual(initialItems[2]);
      expect(newItems[2]).toEqual(initialItems[0]);
    });

    it('should handle drag and drop from available to selected list', () => {
      const event = {
        previousContainer: { id: 'available-list' },
        container: { id: 'selected-list' },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Record<string, unknown>[]>;

      spectator.component.onDrop(event);
      spectator.detectChanges();

      expect(spectator.component.availableList().items).toHaveLength(2);
      expect(spectator.component.selectedList().items).toHaveLength(1);
      expect(spectator.component.selectedList().items[0]).toEqual(testData[0]);
    });

    it('should handle drag and drop from selected to available list', () => {
      // Set initial state with one item selected
      spectator.setInput('destination', [testData[0]]);
      spectator.detectChanges();

      const event = {
        previousContainer: { id: 'selected-list' },
        container: { id: 'available-list' },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Record<string, unknown>[]>;

      spectator.component.onDrop(event);
      spectator.detectChanges();

      expect(spectator.component.availableList().items).toHaveLength(3);
      expect(spectator.component.selectedList().items).toHaveLength(0);
    });

    it('should update destination after drag and drop', () => {
      const event = {
        previousContainer: { id: 'available-list' },
        container: { id: 'selected-list' },
        previousIndex: 1,
        currentIndex: 0,
      } as unknown as CdkDragDrop<Record<string, unknown>[]>;

      spectator.component.onDrop(event);
      spectator.detectChanges();

      expect(spectator.component.destination()).toEqual([testData[1]]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty source list', () => {
      spectator.setInput('source', []);
      spectator.detectChanges();

      expect(spectator.component.availableList().items).toHaveLength(0);
      expect(spectator.component.canMoveAllRight()).toBe(false);
    });

    it('should handle empty destination list', () => {
      spectator.setInput('destination', []);
      spectator.detectChanges();

      expect(spectator.component.selectedList().items).toHaveLength(0);
      expect(spectator.component.canMoveAllLeft()).toBe(false);
    });

    it('should handle all items in destination', () => {
      spectator.setInput('destination', testData);
      spectator.detectChanges();

      expect(spectator.component.availableList().items).toHaveLength(0);
      expect(spectator.component.selectedList().items).toHaveLength(3);
    });

    it('should handle Enter key on item', () => {
      const listItems = spectator.queryAll('tn-list-item');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      listItems[0].dispatchEvent(enterEvent);
      spectator.detectChanges();

      expect(spectator.component.availableList().selectedKeys.has(1)).toBe(true);
    });

    it('should ignore keys that are neither navigation nor printable', () => {
      const listItems = spectator.queryAll('tn-list-item');
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });

      listItems[0].dispatchEvent(escapeEvent);
      spectator.detectChanges();

      expect(spectator.component.availableList().selectedKeys.size).toBe(0);
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

      const items = customSpectator.component.availableList().items;
      expect(items).toHaveLength(2);

      const displayText = customSpectator.queryAll('tn-list-item label');
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
    it('should announce changes to screen readers', async () => {
      const listItems = spectator.queryAll('tn-list-item');
      spectator.click(listItems[0]);

      spectator.component.moveSelectedRight();
      spectator.detectChanges();

      // Check that ARIA message is set
      expect(spectator.component.ariaMessage()).toContain('Moved 1 item to');

      // Wait for timeout to clear message
      await new Promise((resolve) => {
        setTimeout(resolve, 1100);
      });
      expect(spectator.component.ariaMessage()).toBe('');
    });

    it('should have ARIA live region in template', () => {
      const ariaRegion = spectator.query('[role="status"][aria-live="polite"]');
      expect(ariaRegion).toBeTruthy();
    });

    it('should have proper ARIA labels on lists', () => {
      const lists = spectator.queryAll('tn-list');
      expect(lists[0].getAttribute('aria-label')).toBe('Available Items');
      expect(lists[1].getAttribute('aria-label')).toBe('Selected Items');
    });
  });
});
