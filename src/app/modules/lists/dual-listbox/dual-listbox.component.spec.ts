import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
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
    const paragraphs = spectator.queryAll('p');
    expect(paragraphs[0]).toHaveText('Available Items');
    expect(paragraphs[1]).toHaveText('Selected Items');
  });

  it('should initialize with all items in available list', () => {
    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should select an item when clicked', () => {
    const listItems = spectator.queryAll('mat-list-item');
    spectator.click(listItems[0]);

    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);
  });

  it('should toggle selection with Ctrl key', () => {
    const listItems = spectator.queryAll('mat-list-item');

    // First click - select item 0
    spectator.click(listItems[0]);
    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);

    // Ctrl-click item 1 - add to selection
    listItems[1].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);
    expect(spectator.component.availableList().selectedIndices.has(1)).toBe(true);

    // Ctrl-click item 0 again - remove from selection
    listItems[0].dispatchEvent(new MouseEvent('click', { ctrlKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(false);
    expect(spectator.component.availableList().selectedIndices.has(1)).toBe(true);
  });

  it('should select range with Shift key', () => {
    const listItems = spectator.queryAll('mat-list-item');

    // First click - select item 0
    spectator.click(listItems[0]);
    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);

    // Shift-click item 2 - select range 0-2
    listItems[2].dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
    spectator.detectChanges();
    expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);
    expect(spectator.component.availableList().selectedIndices.has(1)).toBe(true);
    expect(spectator.component.availableList().selectedIndices.has(2)).toBe(true);
  });

  it('should move selected items from available to selected', async () => {
    // Select first item
    const listItems = spectator.queryAll('mat-list-item');
    spectator.click(listItems[0]);

    // Click move right button
    const moveRightButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }),
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
    const listItems = spectator.queryAll('mat-list-item');
    const selectedListItems = listItems.slice(2); // Skip available list items
    spectator.click(selectedListItems[0]);

    // Click move left button
    const moveLeftButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-left"]' }),
    );
    await moveLeftButton.click();

    spectator.detectChanges();

    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should move all items from available to selected', async () => {
    const moveAllRightButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-all-right"]' }),
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
      MatButtonHarness.with({ selector: '[ixTest="move-all-left"]' }),
    );
    await moveAllLeftButton.click();

    spectator.detectChanges();

    expect(spectator.component.availableList().items).toHaveLength(3);
    expect(spectator.component.selectedList().items).toHaveLength(0);
  });

  it('should disable move buttons when there is no selection', async () => {
    const moveRightButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }),
    );
    const moveLeftButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-left"]' }),
    );

    expect(await moveRightButton.isDisabled()).toBe(true);
    expect(await moveLeftButton.isDisabled()).toBe(true);
  });

  it('should enable move right button when items are selected in available list', async () => {
    // Select first item
    const listItems = spectator.queryAll('mat-list-item');
    spectator.click(listItems[0]);
    spectator.detectChanges();

    const moveRightButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }),
    );

    expect(await moveRightButton.isDisabled()).toBe(false);
  });

  it('should update destination model when items are moved', async () => {
    // Select and move first item
    const listItems = spectator.queryAll('mat-list-item');
    spectator.click(listItems[0]);

    const moveRightButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }),
    );
    await moveRightButton.click();

    spectator.detectChanges();

    expect(spectator.component.destination()).toEqual([{ id: 1, name: 'Item 1' }]);
  });

  it('should display custom icon when listItemIcon is provided', () => {
    spectator.setInput('listItemIcon', 'mdi-account');
    spectator.detectChanges();

    const icons = spectator.queryAll('ix-icon');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should show keyboard shortcut hint', () => {
    const hint = spectator.query('.hint');
    expect(hint).toContainText('You can select multiple items with');
  });

  describe('Drag and Drop', () => {
    it('should handle drag and drop within the same list', () => {
      const listState = spectator.component.availableList();
      const initialItems = [...listState.items];
      expect(initialItems).toHaveLength(3);

      // Create a container reference that will be used in the event
      const container = { id: 'available-list', data: listState };

      // Simulate drag from index 0 to index 2 within available list
      const event = {
        previousContainer: container,
        container,
        previousIndex: 0,
        currentIndex: 2,
      } as unknown as CdkDragDrop<typeof listState>;

      spectator.component.onDrop(event);

      // Wait for microtask to complete
      return new Promise<void>((resolve) => {
        queueMicrotask(() => {
          spectator.detectChanges();
          const newItems = spectator.component.availableList().items;
          expect(newItems).toHaveLength(3);
          expect(newItems[0]).toEqual(initialItems[1]);
          expect(newItems[1]).toEqual(initialItems[2]);
          expect(newItems[2]).toEqual(initialItems[0]);
          resolve();
        });
      });
    });

    it('should handle drag and drop from available to selected list', () => {
      const availableList = spectator.component.availableList();
      const selectedList = spectator.component.selectedList();

      // Simulate drag from available to selected
      const event = {
        previousContainer: {
          id: 'available-list',
          data: availableList,
        },
        container: {
          id: 'selected-list',
          data: selectedList,
        },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<typeof availableList>;

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

      const availableList = spectator.component.availableList();
      const selectedList = spectator.component.selectedList();

      // Simulate drag from selected to available
      const event = {
        previousContainer: {
          id: 'selected-list',
          data: selectedList,
        },
        container: {
          id: 'available-list',
          data: availableList,
        },
        previousIndex: 0,
        currentIndex: 0,
      } as unknown as CdkDragDrop<typeof selectedList>;

      spectator.component.onDrop(event);
      spectator.detectChanges();

      expect(spectator.component.availableList().items).toHaveLength(3);
      expect(spectator.component.selectedList().items).toHaveLength(0);
    });

    it('should update destination after drag and drop', () => {
      const availableList = spectator.component.availableList();
      const selectedList = spectator.component.selectedList();

      const event = {
        previousContainer: {
          id: 'available-list',
          data: availableList,
        },
        container: {
          id: 'selected-list',
          data: selectedList,
        },
        previousIndex: 1,
        currentIndex: 0,
      } as unknown as CdkDragDrop<typeof availableList>;

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
      const listItems = spectator.queryAll('mat-list-item');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      listItems[0].dispatchEvent(enterEvent);
      spectator.detectChanges();

      expect(spectator.component.availableList().selectedIndices.has(0)).toBe(true);
    });

    it('should ignore other keys', () => {
      const listItems = spectator.queryAll('mat-list-item');
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

      listItems[0].dispatchEvent(spaceEvent);
      spectator.detectChanges();

      expect(spectator.component.availableList().selectedIndices.has(0)).toBe(false);
    });
  });

  describe('Sorting', () => {
    it('should sort items when sort is enabled', () => {
      const unsortedData = [
        { id: 3, name: 'Zebra' },
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
      ];

      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', true);
      spectator.detectChanges();

      const items = spectator.component.availableList().items;
      expect(items[0].name).toBe('Apple');
      expect(items[1].name).toBe('Banana');
      expect(items[2].name).toBe('Zebra');
    });

    it('should not sort items when sort is disabled', () => {
      const unsortedData = [
        { id: 3, name: 'Zebra' },
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Banana' },
      ];

      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', false);
      spectator.detectChanges();

      const items = spectator.component.availableList().items;
      expect(items[0].name).toBe('Zebra');
      expect(items[1].name).toBe('Apple');
      expect(items[2].name).toBe('Banana');
    });

    it('should sort destination items after move when sort is enabled', async () => {
      const unsortedData = [
        { id: 3, name: 'Zebra' },
        { id: 1, name: 'Apple' },
      ];

      spectator.setInput('source', unsortedData);
      spectator.setInput('sort', true);
      spectator.detectChanges();

      // Select first item (Apple after sorting)
      const listItems = spectator.queryAll('mat-list-item');
      spectator.click(listItems[0]);

      // Move to selected
      const moveRightButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[ixTest="move-selected-right"]' }),
      );
      await moveRightButton.click();
      spectator.detectChanges();

      // Select second item (Zebra)
      const availableItems = spectator.queryAll('mat-list-item');
      spectator.click(availableItems[0]);

      await moveRightButton.click();
      spectator.detectChanges();

      // Verify items are sorted in destination
      const selectedItems = spectator.component.selectedList().items;
      expect(selectedItems[0].name).toBe('Apple');
      expect(selectedItems[1].name).toBe('Zebra');
    });
  });

  describe('Custom key and display properties', () => {
    it('should use custom key property', () => {
      // Mock console methods since validation and trackBy will run with mismatched keys initially
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const customData = [
        { uuid: 'a1', label: 'First' },
        { uuid: 'a2', label: 'Second' },
      ];

      spectator.setInput('source', customData);
      spectator.setInput('key', 'uuid');
      spectator.setInput('display', 'label');
      spectator.detectChanges();

      const items = spectator.component.availableList().items;
      expect(items).toHaveLength(2);

      const displayText = spectator.queryAll('mat-list-item label');
      expect(displayText[0]).toHaveText('First');
      expect(displayText[1]).toHaveText('Second');

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should log error for invalid key property', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const invalidData = [{ name: 'Item' }];

      spectator.setInput('source', invalidData);
      spectator.setInput('key', 'invalidKey');
      spectator.detectChanges();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'DualListBox: key property "invalidKey" not found in source items',
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log error for invalid display property', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const invalidData = [{ id: 1 }];

      spectator.setInput('source', invalidData);
      spectator.setInput('display', 'invalidDisplay');
      spectator.detectChanges();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'DualListBox: display property "invalidDisplay" not found in source items',
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should announce changes to screen readers', async () => {
      const listItems = spectator.queryAll('mat-list-item');
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
      const lists = spectator.queryAll('mat-list');
      expect(lists[0].getAttribute('aria-label')).toBe('Available Items');
      expect(lists[1].getAttribute('aria-label')).toBe('Selected Items');
    });
  });
});
