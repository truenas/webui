import { signal } from '@angular/core';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { DualListBoxSide } from 'app/modules/lists/dual-listbox/dual-listbox-side';

interface TestItem {
  id: number;
  name: string;
}

describe('DualListBoxSide', () => {
  const items: TestItem[] = [
    { id: 1, name: 'Zebra' },
    { id: 2, name: 'apple' },
    { id: 3, name: 'Banana' },
  ];

  let sort: ReturnType<typeof signal<boolean>>;
  let side: DualListBoxSide<TestItem>;

  const namesOf = (values: TestItem[]): string[] => values.map((item) => item.name);

  beforeEach(() => {
    sort = signal(false);
    side = new DualListBoxSide<TestItem>({ key: signal('id'), display: signal('name'), sort });
    side.reset(items);
  });

  describe('what the list shows', () => {
    it('keeps the given order while sorting is off', () => {
      expect(namesOf(side.visibleItems())).toEqual(['Zebra', 'apple', 'Banana']);
    });

    it('sorts case-insensitively and reverses on toggle when sorting is on', () => {
      sort.set(true);

      expect(namesOf(side.visibleItems())).toEqual(['apple', 'Banana', 'Zebra']);

      side.toggleSort();

      expect(side.sortDirection()).toBe(SortDirection.Desc);
      expect(namesOf(side.visibleItems())).toEqual(['Zebra', 'Banana', 'apple']);
    });

    it('filters on the display value, ignoring case and surrounding spaces', () => {
      side.search.set('  AN  ');

      expect(namesOf(side.visibleItems())).toEqual(['Banana']);
    });

    it('sorts what the filter left, not the whole list', () => {
      sort.set(true);
      side.search.set('e');

      expect(namesOf(side.visibleItems())).toEqual(['apple', 'Zebra']);
    });
  });

  describe('selection', () => {
    it('replaces the selection on a plain select', () => {
      side.select(0, { ctrl: false, shift: false });
      side.select(1, { ctrl: false, shift: false });

      expect(namesOf(side.selectedItems())).toEqual(['apple']);
    });

    it('toggles a single item with ctrl', () => {
      side.select(0, { ctrl: true, shift: false });
      side.select(2, { ctrl: true, shift: false });

      expect(namesOf(side.selectedItems())).toEqual(['Zebra', 'Banana']);

      side.select(0, { ctrl: true, shift: false });

      expect(namesOf(side.selectedItems())).toEqual(['Banana']);
    });

    it('selects the range between the anchor and the item with shift', () => {
      side.select(2, { ctrl: false, shift: false });
      side.select(0, { ctrl: false, shift: true });

      expect(namesOf(side.selectedItems())).toEqual(['Zebra', 'apple', 'Banana']);
    });

    it('grows consecutive shift ranges from the original anchor', () => {
      side.select(0, { ctrl: false, shift: false });
      side.select(2, { ctrl: false, shift: true });
      side.select(1, { ctrl: false, shift: true });

      // Still anchored on the first item, so the range shrank instead of starting over.
      expect(namesOf(side.selectedItems())).toEqual(['Zebra', 'apple']);
    });

    it('extends from the tab stop when shift is used before anything is anchored', () => {
      side.activeIndex.set(1);

      side.select(2, { ctrl: false, shift: true });

      expect(namesOf(side.selectedItems())).toEqual(['apple', 'Banana']);
    });

    it('keeps the existing selection when ctrl and shift are combined', () => {
      side.select(0, { ctrl: true, shift: false });
      side.select(2, { ctrl: true, shift: false });
      side.select(1, { ctrl: true, shift: true });

      expect(namesOf(side.selectedItems())).toEqual(['Zebra', 'apple', 'Banana']);
    });

    it('ignores a selection outside the visible items', () => {
      side.select(9, { ctrl: false, shift: false });

      expect(side.selectedItems()).toEqual([]);
      expect(side.activeIndex()).toBe(0);
    });

    it('keeps a selection through a sort, since it is held by key', () => {
      side.select(0, { ctrl: false, shift: false });
      sort.set(true);

      expect(namesOf(side.selectedItems())).toEqual(['Zebra']);
    });

    it('hides a selected item from selectedItems while the search filters it out', () => {
      side.select(0, { ctrl: false, shift: false });
      side.search.set('Banana');

      expect(side.selectedItems()).toEqual([]);
      expect(side.hasSelection()).toBe(false);

      // The key survived, so widening the search brings the selection back.
      side.search.set('');

      expect(namesOf(side.selectedItems())).toEqual(['Zebra']);
      expect(side.hasSelection()).toBe(true);
    });

    it('drops the selection and the anchor when the items are replaced', () => {
      side.select(0, { ctrl: false, shift: false });
      side.reset([items[1]]);

      expect(side.selectedItems()).toEqual([]);
      expect(side.isSelected(items[1])).toBe(false);
    });
  });

  describe('tab stop', () => {
    it('follows the last selected item', () => {
      side.select(2, { ctrl: false, shift: false });

      expect(side.tabStop()).toBe(2);
    });

    it('clamps onto the last visible item when the list shrinks', () => {
      side.select(2, { ctrl: false, shift: false });
      side.search.set('e');

      expect(side.visibleItems()).toHaveLength(2);
      expect(side.tabStop()).toBe(1);
    });

    it('falls back to zero when nothing is visible', () => {
      side.select(2, { ctrl: false, shift: false });
      side.search.set('nothing matches this');

      expect(side.tabStop()).toBe(0);
    });
  });
});
