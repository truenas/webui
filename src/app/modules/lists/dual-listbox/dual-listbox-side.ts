import { computed, signal, Signal } from '@angular/core';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';

/** Which of the two lists a value belongs to. Doubles as the list's DOM id and test-id suffix. */
export type ListType = 'available' | 'selected';

/** How a click or a key press changes the selection. */
export interface SelectionModifiers {
  /** Ctrl on Windows and Linux, Cmd on macOS: toggles a single item. */
  ctrl: boolean;
  /** Selects the range between the anchor and the clicked item. */
  shift: boolean;
}

interface DualListBoxSideConfig {
  /** Name of the item property holding the identity of an item. */
  key: Signal<string>;
  /** Name of the item property holding the label shown to the user. */
  display: Signal<string>;
  /** Whether the lists are sorted alphabetically at all. */
  sort: Signal<boolean>;
}

/**
 * One side of the dual listbox: its items, its selection, and the search and sort state
 * that decide what it shows.
 *
 * The items and the selection are separate signals on purpose: the selection changes on every
 * click, arrow key and space press, and must not invalidate `visibleItems`, whose filter and
 * sort are O(n log n) over lists that can hold thousands of items.
 */
export class DualListBoxSide<T> {
  /** The list's items, before the search field and the sort toggle are applied. */
  readonly items = signal<T[]>([]);
  readonly search = signal('');
  readonly sortDirection = signal(SortDirection.Asc);

  /**
   * Which item is the list's single tab stop (roving tabindex), as an index into the visible
   * items. Keeping one tab stop per list means Tab reaches the move buttons after one stop
   * instead of walking through every item.
   */
  readonly activeIndex = signal(0);

  /**
   * Keys of the selected items. Keys rather than indices, so a selection survives the list
   * being filtered by the search field or re-ordered by the sort toggle.
   */
  private readonly selectedKeys = signal<Set<unknown>>(new Set());

  /** Anchor for Shift-click range selection. */
  private readonly anchorKey = signal<unknown>(null);

  /** What the list renders: its items, filtered by the search field and ordered by the sort toggle. */
  readonly visibleItems = computed(() => this.presentItems());

  /**
   * The selected items that are actually on screen. The selection is intersected with what
   * the search field left visible, so a move can never carry off an item the user cannot see.
   */
  readonly selectedItems = computed(() => {
    const selectedKeys = this.selectedKeys();
    return this.visibleItems().filter((item) => selectedKeys.has(this.keyOf(item)));
  });

  readonly hasSelection = computed(() => this.selectedItems().length > 0);

  /** `activeIndex`, clamped so the tab stop stays on a rendered item after a search, sort or move. */
  readonly tabStop = computed(() => {
    const length = this.visibleItems().length;
    if (length === 0) {
      return 0;
    }

    return Math.min(Math.max(this.activeIndex(), 0), length - 1);
  });

  constructor(private config: DualListBoxSideConfig) {}

  keyOf(item: T): unknown {
    return (item as Record<string, unknown>)[this.config.key()];
  }

  displayOf(item: T): string {
    return String((item as Record<string, unknown>)[this.config.display()] || '');
  }

  isSelected(item: T): boolean {
    return this.selectedKeys().has(this.keyOf(item));
  }

  /** Replaces the items and drops the selection that belonged to the old ones. */
  reset(items: T[]): void {
    this.items.set(items);
    this.selectedKeys.set(new Set());
    this.anchorKey.set(null);
  }

  toggleSort(): void {
    this.sortDirection.update((direction) => (
      direction === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc
    ));
  }

  /**
   * `index` is the position within the currently visible (filtered and sorted) items,
   * which is what the user sees and what Shift ranges are measured against.
   */
  select(index: number, modifiers: SelectionModifiers): void {
    const visible = this.visibleItems();
    const item = visible[index];

    if (!item) {
      return;
    }

    this.activeIndex.set(index);

    const itemKey = this.keyOf(item);
    const newSelectedKeys = new Set(this.selectedKeys());

    if (modifiers.shift) {
      const anchorIndex = visible.findIndex((visibleItem) => this.keyOf(visibleItem) === this.anchorKey());

      if (anchorIndex !== -1) {
        // Shift alone replaces the selection with the range; Ctrl+Shift adds to it.
        if (!modifiers.ctrl) {
          newSelectedKeys.clear();
        }

        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);
        for (let i = start; i <= end; i++) {
          newSelectedKeys.add(this.keyOf(visible[i]));
        }

        // Keep the original anchor so consecutive Shift-clicks grow from the same point.
        this.selectedKeys.set(newSelectedKeys);
        return;
      }

      newSelectedKeys.clear();
      newSelectedKeys.add(itemKey);
    } else if (modifiers.ctrl) {
      // Ctrl/Cmd-click: toggle selection
      if (newSelectedKeys.has(itemKey)) {
        newSelectedKeys.delete(itemKey);
      } else {
        newSelectedKeys.add(itemKey);
      }
    } else {
      // Regular click: select only this item
      newSelectedKeys.clear();
      newSelectedKeys.add(itemKey);
    }

    this.selectedKeys.set(newSelectedKeys);
    this.anchorKey.set(itemKey);
  }

  private presentItems(): T[] {
    const items = this.items();
    const query = this.search().trim().toLowerCase();
    const filtered = query
      ? items.filter((item) => this.displayOf(item).toLowerCase().includes(query))
      : items;

    if (!this.config.sort()) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => this.displayOf(a).localeCompare(this.displayOf(b)));
    return this.sortDirection() === SortDirection.Desc ? sorted.reverse() : sorted;
  }
}
