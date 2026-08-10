import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { NgStyle } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  signal,
  viewChildren,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconButtonComponent, TnIconComponent, TnInputComponent, TnListComponent, TnListIconDirective,
  TnListItemComponent, tnIconMarker,
} from '@truenas/ui-components';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { DetectBrowserService } from 'app/services/detect-browser.service';

type ListType = 'available' | 'selected';

interface ListState<T> {
  items: T[];
  /**
   * Keys of the selected items. Keys rather than indices, so a selection survives
   * the list being filtered by the search field or re-ordered by the sort toggle.
   */
  selectedKeys: Set<unknown>;
  /** Anchor for Shift-click range selection. */
  lastSelectedKey: unknown;
}

/** How long a type-ahead buffer stays alive between keystrokes. */
const typeAheadResetTimeout = 800;

@Component({
  selector: 'ix-dual-listbox',
  templateUrl: './dual-listbox.component.html',
  styleUrls: ['./dual-listbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgStyle,
    DragDropModule,
    FormsModule,
    TnIconComponent,
    TnIconButtonComponent,
    TnInputComponent,
    TnListComponent,
    TnListIconDirective,
    TnListItemComponent,
    TranslateModule,
  ],
})
export class DualListBoxComponent<T = Record<string, unknown>> {
  private detectBrowser = inject(DetectBrowserService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private translate = inject(TranslateService);

  // Inputs
  sourceName = input.required<string>();
  targetName = input.required<string>();
  listItemIcon = input<string | null>(null);
  source = input.required<T[]>();
  destination = model<T[]>([]);
  key = input<string>('id');
  display = input<string>('name');
  height = input<string>('250px');
  /** Sorts both lists alphabetically and shows a sort-direction toggle above each of them. */
  sort = input<boolean>(false);
  /** Shows a search field above each list. */
  searchable = input<boolean>(true);

  protected isMacOs = this.detectBrowser.isMacOs();

  protected ariaMessage = signal('');

  protected availableList = signal<ListState<T>>({
    items: [],
    selectedKeys: new Set(),
    lastSelectedKey: null,
  });

  protected selectedList = signal<ListState<T>>({
    items: [],
    selectedKeys: new Set(),
    lastSelectedKey: null,
  });

  protected availableSearch = signal('');
  protected selectedSearch = signal('');
  private availableSortDirection = signal(SortDirection.Asc);
  private selectedSortDirection = signal(SortDirection.Asc);

  /**
   * Which item is the list's single tab stop (roving tabindex), as an index into the
   * visible items. Keeping one tab stop per list means Tab reaches the move buttons
   * after one stop instead of walking through every item.
   */
  private availableActiveIndex = signal(0);
  private selectedActiveIndex = signal(0);

  /** What each list actually renders: the raw items, filtered by search and ordered by the sort toggle. */
  protected availableItems = computed(() => this.presentItems(
    this.availableList().items,
    this.availableSearch(),
    this.availableSortDirection(),
  ));

  protected selectedItems = computed(() => this.presentItems(
    this.selectedList().items,
    this.selectedSearch(),
    this.selectedSortDirection(),
  ));

  protected hasAvailableSelection = computed(() => this.availableList().selectedKeys.size > 0);
  protected hasSelectedSelection = computed(() => this.selectedList().selectedKeys.size > 0);
  protected canMoveAllRight = computed(() => this.availableItems().length > 0);
  protected canMoveAllLeft = computed(() => this.selectedItems().length > 0);

  /** Clamped, so the tab stop stays on a rendered item after a search, sort or move. */
  protected availableTabStop = computed(() => this.clampIndex(
    this.availableActiveIndex(),
    this.availableItems().length,
  ));

  protected selectedTabStop = computed(() => this.clampIndex(
    this.selectedActiveIndex(),
    this.selectedItems().length,
  ));

  protected availableCountLabel = computed(() => this.countLabel(
    this.availableItems().length,
    this.availableList().items.length,
  ));

  protected selectedCountLabel = computed(() => this.countLabel(
    this.selectedItems().length,
    this.selectedList().items.length,
  ));

  protected availableSortIcon = computed(() => this.sortIcon(this.availableSortDirection()));
  protected selectedSortIcon = computed(() => this.sortIcon(this.selectedSortDirection()));
  protected availableSortLabel = computed(() => this.sortLabel(this.availableSortDirection()));
  protected selectedSortLabel = computed(() => this.sortLabel(this.selectedSortDirection()));

  private availableItemElements = viewChildren('availableItem', { read: ElementRef<HTMLElement> });
  private selectedItemElements = viewChildren('selectedItem', { read: ElementRef<HTMLElement> });

  private isUpdatingFromDrag = false;
  private ariaTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private typeAheadBuffer = '';
  private typeAheadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Sync source and destination with internal state
    effect(() => {
      // Don't sync during drag operations to avoid race conditions
      if (this.isUpdatingFromDrag) {
        return;
      }

      const sourceItems = this.source();
      const destItems = this.destination();
      const keyProp = this.key();
      const displayProp = this.display();

      // Validate that key and display properties exist in items
      this.validateInputs(sourceItems, keyProp, displayProp);

      // Get IDs of destination items
      const destIds = new Set(destItems.map((item) => this.getItemKey(item, keyProp)));

      // Available items are those not in destination
      const available = sourceItems.filter((item) => !destIds.has(this.getItemKey(item, keyProp)));

      this.availableList.set({
        items: available,
        selectedKeys: new Set(),
        lastSelectedKey: null,
      });

      this.selectedList.set({
        items: destItems,
        selectedKeys: new Set(),
        lastSelectedKey: null,
      });
    });

    // Clean up pending timeouts on destroy
    this.destroyRef.onDestroy(() => {
      if (this.ariaTimeoutId !== null) {
        clearTimeout(this.ariaTimeoutId);
      }
      if (this.typeAheadTimeoutId !== null) {
        clearTimeout(this.typeAheadTimeoutId);
      }
    });
  }

  private validateInputs(items: T[], keyProp: string, displayProp: string): void {
    if (items.length === 0) {
      return;
    }

    const firstItem = items[0] as Record<string, unknown>;

    if (!(keyProp in firstItem)) {
      throw new Error(`DualListBox: key property "${keyProp}" not found in source items. Available properties: ${Object.keys(firstItem).join(', ')}`);
    }

    if (!(displayProp in firstItem)) {
      throw new Error(`DualListBox: display property "${displayProp}" not found in source items. Available properties: ${Object.keys(firstItem).join(', ')}`);
    }
  }

  private getItemKey(item: T, keyProp: string): unknown {
    return (item as Record<string, unknown>)[keyProp];
  }

  private getItemDisplay(item: T, displayProp: string): string {
    return String((item as Record<string, unknown>)[displayProp] || '');
  }

  protected getDisplayValue(item: T): string {
    return this.getItemDisplay(item, this.display());
  }

  protected trackByKey(index: number, item: T): unknown {
    return this.getItemKey(item, this.key());
  }

  private presentItems(items: T[], search: string, direction: SortDirection): T[] {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? items.filter((item) => this.getDisplayValue(item).toLowerCase().includes(query))
      : items;

    if (!this.sort()) {
      return filtered;
    }

    const sorted = [...filtered].sort((a, b) => this.getDisplayValue(a).localeCompare(this.getDisplayValue(b)));
    return direction === SortDirection.Desc ? sorted.reverse() : sorted;
  }

  private countLabel(shown: number, total: number): string {
    if (shown === total) {
      return String(total);
    }

    return this.translate.instant('{shown} of {total}', { shown, total });
  }

  private sortIcon(direction: SortDirection): string {
    return direction === SortDirection.Asc
      ? tnIconMarker('sort-alphabetical-ascending', 'mdi')
      : tnIconMarker('sort-alphabetical-descending', 'mdi');
  }

  private sortLabel(direction: SortDirection): string {
    return direction === SortDirection.Asc
      ? this.translate.instant('Sorted A to Z. Click to sort Z to A.')
      : this.translate.instant('Sorted Z to A. Click to sort A to Z.');
  }

  protected toggleSort(listType: ListType): void {
    const directionSignal = listType === 'available' ? this.availableSortDirection : this.selectedSortDirection;
    directionSignal.update((direction) => (
      direction === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc
    ));
  }

  private listState(listType: ListType): ListState<T> {
    return listType === 'available' ? this.availableList() : this.selectedList();
  }

  private listSignal(listType: ListType): WritableSignal<ListState<T>> {
    return listType === 'available' ? this.availableList : this.selectedList;
  }

  private visibleItems(listType: ListType): T[] {
    return listType === 'available' ? this.availableItems() : this.selectedItems();
  }

  private activeIndexSignal(listType: ListType): WritableSignal<number> {
    return listType === 'available' ? this.availableActiveIndex : this.selectedActiveIndex;
  }

  private clampIndex(index: number, length: number): number {
    if (length === 0) {
      return 0;
    }

    return Math.min(Math.max(index, 0), length - 1);
  }

  private announceChange(message: string): void {
    // Clear any existing timeout
    if (this.ariaTimeoutId !== null) {
      clearTimeout(this.ariaTimeoutId);
    }

    this.ariaMessage.set(message);
    this.ariaTimeoutId = setTimeout(() => {
      this.ariaMessage.set('');
      this.ariaTimeoutId = null;
    }, 1000);
  }

  protected isItemSelected(listState: ListState<T>, item: T): boolean {
    return listState.selectedKeys.has(this.getItemKey(item, this.key()));
  }

  /**
   * `index` is the position within the currently visible (filtered and sorted) items,
   * which is what the user sees and what Shift-click ranges are measured against.
   */
  protected onItemClick(listType: ListType, index: number, event: MouseEvent): void {
    const visible = this.visibleItems(listType);
    const item = visible[index];

    if (!item) {
      return;
    }

    this.activeIndexSignal(listType).set(index);

    const listState = this.listState(listType);
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const itemKey = this.getItemKey(item, this.key());
    const newSelectedKeys = new Set(listState.selectedKeys);

    if (isShift) {
      const anchorIndex = visible.findIndex(
        (visibleItem) => this.getItemKey(visibleItem, this.key()) === listState.lastSelectedKey,
      );

      if (anchorIndex !== -1) {
        // Shift alone replaces the selection with the range; Ctrl+Shift adds to it.
        if (!isCtrlOrCmd) {
          newSelectedKeys.clear();
        }

        const start = Math.min(anchorIndex, index);
        const end = Math.max(anchorIndex, index);
        for (let i = start; i <= end; i++) {
          newSelectedKeys.add(this.getItemKey(visible[i], this.key()));
        }

        // Keep the original anchor so consecutive Shift-clicks grow from the same point.
        this.listSignal(listType).set({ ...listState, selectedKeys: newSelectedKeys });
        return;
      }

      newSelectedKeys.clear();
      newSelectedKeys.add(itemKey);
    } else if (isCtrlOrCmd) {
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

    this.listSignal(listType).set({
      ...listState,
      selectedKeys: newSelectedKeys,
      lastSelectedKey: itemKey,
    });
  }

  protected onItemKeydown(listType: ListType, index: number, event: KeyboardEvent): void {
    const visible = this.visibleItems(listType);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusAndSelect(listType, Math.min(index + 1, visible.length - 1), event);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusAndSelect(listType, Math.max(index - 1, 0), event);
        return;
      case 'Home':
        event.preventDefault();
        this.focusAndSelect(listType, 0, event);
        return;
      case 'End':
        event.preventDefault();
        this.focusAndSelect(listType, visible.length - 1, event);
        return;
      case ' ':
        event.preventDefault();
        this.onItemClick(listType, index, { ctrlKey: true, shiftKey: false } as MouseEvent);
        return;
      case 'Enter':
        this.onItemClick(listType, index, event as unknown as MouseEvent);
        return;
      default:
        break;
    }

    // Type-ahead: typing jumps to the first item starting with what was typed.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.jumpToTypedItem(listType, event.key);
    }
  }

  private focusAndSelect(listType: ListType, index: number, event: KeyboardEvent): void {
    if (index < 0 || index >= this.visibleItems(listType).length) {
      return;
    }

    // Ctrl/Cmd + arrows move focus without disturbing the current selection.
    if (!event.ctrlKey && !event.metaKey) {
      this.onItemClick(listType, index, event as unknown as MouseEvent);
    }

    this.focusItem(listType, index);
  }

  private focusItem(listType: ListType, index: number): void {
    this.activeIndexSignal(listType).set(index);

    const elements = listType === 'available' ? this.availableItemElements() : this.selectedItemElements();
    elements[index]?.nativeElement.focus();
  }

  private jumpToTypedItem(listType: ListType, character: string): void {
    if (this.typeAheadTimeoutId !== null) {
      clearTimeout(this.typeAheadTimeoutId);
    }

    this.typeAheadBuffer += character.toLowerCase();
    this.typeAheadTimeoutId = setTimeout(() => {
      this.typeAheadBuffer = '';
      this.typeAheadTimeoutId = null;
    }, typeAheadResetTimeout);

    const visible = this.visibleItems(listType);
    const matchIndex = visible.findIndex(
      (item) => this.getDisplayValue(item).toLowerCase().startsWith(this.typeAheadBuffer),
    );

    if (matchIndex === -1) {
      return;
    }

    this.onItemClick(listType, matchIndex, { ctrlKey: false, shiftKey: false } as MouseEvent);
    this.focusItem(listType, matchIndex);
  }

  protected moveSelectedRight(): void {
    const items = this.getSelectedItems('available');
    this.transferItems('available', 'selected', items);
    this.announceMove(items.length, this.targetName());
  }

  protected moveSelectedLeft(): void {
    const items = this.getSelectedItems('selected');
    this.transferItems('selected', 'available', items);
    this.announceMove(items.length, this.sourceName());
  }

  /** Moves every item the list currently shows, so a search field narrows what "all" means. */
  protected moveAllRight(): void {
    const items = this.availableItems();
    this.transferItems('available', 'selected', items);
    this.announceMove(items.length, this.targetName(), true);
  }

  protected moveAllLeft(): void {
    const items = this.selectedItems();
    this.transferItems('selected', 'available', items);
    this.announceMove(items.length, this.sourceName(), true);
  }

  private announceMove(count: number, listName: string, all = false): void {
    if (count === 1) {
      this.announceChange(this.translate.instant('Moved 1 item to {list}', { list: listName }));
      return;
    }

    this.announceChange(all
      ? this.translate.instant('Moved all {count} items to {list}', { count, list: listName })
      : this.translate.instant('Moved {count} items to {list}', { count, list: listName }));
  }

  private getSelectedItems(listType: ListType): T[] {
    const listState = this.listState(listType);
    return listState.items.filter((item) => listState.selectedKeys.has(this.getItemKey(item, this.key())));
  }

  private transferItems(fromType: ListType, toType: ListType, itemsToMove: T[]): void {
    if (!itemsToMove.length) {
      return;
    }

    const fromList = this.listState(fromType);
    const toList = this.listState(toType);
    const movedKeys = new Set(itemsToMove.map((item) => this.getItemKey(item, this.key())));

    this.listSignal(fromType).set({
      items: fromList.items.filter((item) => !movedKeys.has(this.getItemKey(item, this.key()))),
      selectedKeys: new Set(),
      lastSelectedKey: null,
    });

    this.listSignal(toType).set({
      items: [...toList.items, ...itemsToMove],
      selectedKeys: new Set(),
      lastSelectedKey: null,
    });

    this.updateDestination();
  }

  /** Maps a position within the visible items onto a position within the full list. */
  private absoluteIndex(items: T[], visible: T[], visibleIndex: number): number {
    if (visibleIndex >= visible.length) {
      return items.length;
    }

    const targetKey = this.getItemKey(visible[visibleIndex], this.key());
    const index = items.findIndex((item) => this.getItemKey(item, this.key()) === targetKey);
    return index === -1 ? items.length : index;
  }

  protected onDrop(event: CdkDragDrop<T[]>): void {
    this.isUpdatingFromDrag = true;

    const fromType: ListType = event.previousContainer.id === 'available-list' ? 'available' : 'selected';
    const toType: ListType = event.container.id === 'available-list' ? 'available' : 'selected';

    if (fromType === toType) {
      this.reorderWithinList(fromType, event.previousIndex, event.currentIndex);
    } else {
      this.transferByDrag(fromType, toType, event.previousIndex, event.currentIndex);
    }

    // Reset flag after next render to ensure proper synchronization with Angular's change detection
    afterNextRender(() => {
      this.isUpdatingFromDrag = false;
    }, { injector: this.injector });
  }

  private reorderWithinList(listType: ListType, previousIndex: number, currentIndex: number): void {
    const listState = this.listState(listType);
    const visible = this.visibleItems(listType);
    const newItems = [...listState.items];

    moveItemInArray(
      newItems,
      this.absoluteIndex(listState.items, visible, previousIndex),
      this.absoluteIndex(listState.items, visible, currentIndex),
    );

    this.listSignal(listType).set({ ...listState, items: newItems });

    if (listType === 'selected') {
      this.updateDestination();
    }

    this.announceChange(this.translate.instant('Item reordered'));
  }

  private transferByDrag(
    fromType: ListType,
    toType: ListType,
    previousIndex: number,
    currentIndex: number,
  ): void {
    const fromList = this.listState(fromType);
    const toList = this.listState(toType);
    const item = this.visibleItems(fromType)[previousIndex];

    if (!item) {
      return;
    }

    const itemKey = this.getItemKey(item, this.key());
    const newToItems = [...toList.items];
    newToItems.splice(this.absoluteIndex(toList.items, this.visibleItems(toType), currentIndex), 0, item);

    this.listSignal(fromType).set({
      items: fromList.items.filter((fromItem) => this.getItemKey(fromItem, this.key()) !== itemKey),
      selectedKeys: new Set(),
      lastSelectedKey: null,
    });

    this.listSignal(toType).set({
      items: newToItems,
      selectedKeys: new Set(),
      lastSelectedKey: null,
    });

    this.updateDestination();
    this.announceMove(1, toType === 'selected' ? this.targetName() : this.sourceName());
  }

  private updateDestination(): void {
    this.destination.set(this.selectedList().items);
  }
}
