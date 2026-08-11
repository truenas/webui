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
  Signal,
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
import { translatedSignal } from 'app/modules/translate/translated-signal';
import { DetectBrowserService } from 'app/services/detect-browser.service';

type ListType = 'available' | 'selected';

/**
 * One side of the dual listbox. What the list holds (`items`) and what the user highlighted
 * (`selectedKeys`) are deliberately separate signals: the selection changes on every click,
 * arrow key and space press, and must not invalidate `visibleItems`, whose filter and sort
 * are O(n log n) over lists that can hold thousands of items.
 */
interface ListState<T> {
  /** The list's items, before the search field and the sort toggle are applied. */
  items: WritableSignal<T[]>;
  /**
   * Keys of the selected items. Keys rather than indices, so a selection survives
   * the list being filtered by the search field or re-ordered by the sort toggle.
   */
  selectedKeys: WritableSignal<Set<unknown>>;
  /** Anchor for Shift-click range selection. */
  anchorKey: WritableSignal<unknown>;
  /**
   * Which item is the list's single tab stop (roving tabindex), as an index into the
   * visible items. Keeping one tab stop per list means Tab reaches the move buttons
   * after one stop instead of walking through every item.
   */
  activeIndex: WritableSignal<number>;
  search: WritableSignal<string>;
  sortDirection: WritableSignal<SortDirection>;
  /** What the list actually renders: its items, filtered by search and ordered by the sort toggle. */
  visibleItems: Signal<T[]>;
  /** `activeIndex`, clamped so the tab stop stays on a rendered item after a search, sort or move. */
  tabStop: Signal<number>;
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

  protected availableList = this.createListState();
  protected selectedList = this.createListState();

  protected hasAvailableSelection = computed(() => this.availableList.selectedKeys().size > 0);
  protected hasSelectedSelection = computed(() => this.selectedList.selectedKeys().size > 0);
  protected canMoveAllRight = computed(() => this.availableList.visibleItems().length > 0);
  protected canMoveAllLeft = computed(() => this.selectedList.visibleItems().length > 0);

  protected availableCountLabel = translatedSignal((translate) => this.countLabel(
    translate,
    this.availableList.visibleItems().length,
    this.availableList.items().length,
  ));

  protected selectedCountLabel = translatedSignal((translate) => this.countLabel(
    translate,
    this.selectedList.visibleItems().length,
    this.selectedList.items().length,
  ));

  protected availableSortIcon = computed(() => this.sortIcon(this.availableList.sortDirection()));
  protected selectedSortIcon = computed(() => this.sortIcon(this.selectedList.sortDirection()));
  protected availableSortLabel = translatedSignal(
    (translate) => this.sortLabel(translate, this.availableList.sortDirection()),
  );

  protected selectedSortLabel = translatedSignal(
    (translate) => this.sortLabel(translate, this.selectedList.sortDirection()),
  );

  private availableItemElements = viewChildren('availableItem', { read: ElementRef<HTMLElement> });
  private selectedItemElements = viewChildren('selectedItem', { read: ElementRef<HTMLElement> });

  private isUpdatingFromDrag = false;
  private ariaTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private typeAheadBuffer = '';
  private typeAheadListType: ListType | null = null;
  private typeAheadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Sync source and destination with internal state
    effect(() => {
      // Read every input up front. Returning before reading them would leave the effect
      // with no producers on that run, and Angular would never schedule it again — the
      // lists would stop following `source` for the rest of the component's life.
      const sourceItems = this.source();
      const destItems = this.destination();
      const keyProp = this.key();
      const displayProp = this.display();

      // Don't sync during drag operations to avoid race conditions
      if (this.isUpdatingFromDrag) {
        return;
      }

      // Validate that key and display properties exist in items
      this.validateInputs(sourceItems, keyProp, displayProp);

      // Get IDs of destination items
      const destIds = new Set(destItems.map((item) => this.getItemKey(item, keyProp)));

      // Available items are those not in destination
      const available = sourceItems.filter((item) => !destIds.has(this.getItemKey(item, keyProp)));

      this.resetList(this.availableList, available);
      this.resetList(this.selectedList, destItems);
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

  private createListState(): ListState<T> {
    const items = signal<T[]>([]);
    const search = signal('');
    const sortDirection = signal(SortDirection.Asc);
    const activeIndex = signal(0);
    const visibleItems = computed(() => this.presentItems(items(), search(), sortDirection()));

    return {
      items,
      selectedKeys: signal<Set<unknown>>(new Set()),
      anchorKey: signal<unknown>(null),
      activeIndex,
      search,
      sortDirection,
      visibleItems,
      tabStop: computed(() => this.clampIndex(activeIndex(), visibleItems().length)),
    };
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

  private countLabel(translate: TranslateService, shown: number, total: number): string {
    if (shown === total) {
      return String(total);
    }

    return translate.instant('{shown} of {total}', { shown, total });
  }

  private sortIcon(direction: SortDirection): string {
    return direction === SortDirection.Asc
      ? tnIconMarker('sort-alphabetical-ascending', 'mdi')
      : tnIconMarker('sort-alphabetical-descending', 'mdi');
  }

  private sortLabel(translate: TranslateService, direction: SortDirection): string {
    return direction === SortDirection.Asc
      ? translate.instant('Sorted A to Z. Click to sort Z to A.')
      : translate.instant('Sorted Z to A. Click to sort A to Z.');
  }

  protected toggleSort(listType: ListType): void {
    this.list(listType).sortDirection.update((direction) => (
      direction === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc
    ));
  }

  private list(listType: ListType): ListState<T> {
    return listType === 'available' ? this.availableList : this.selectedList;
  }

  /** Replaces a list's items and drops the selection that belonged to the old ones. */
  private resetList(list: ListState<T>, items: T[]): void {
    list.items.set(items);
    list.selectedKeys.set(new Set());
    list.anchorKey.set(null);
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

  protected isItemSelected(listType: ListType, item: T): boolean {
    return this.list(listType).selectedKeys().has(this.getItemKey(item, this.key()));
  }

  /**
   * `index` is the position within the currently visible (filtered and sorted) items,
   * which is what the user sees and what Shift-click ranges are measured against.
   */
  protected onItemClick(listType: ListType, index: number, event: MouseEvent): void {
    const list = this.list(listType);
    const visible = list.visibleItems();
    const item = visible[index];

    if (!item) {
      return;
    }

    list.activeIndex.set(index);

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const itemKey = this.getItemKey(item, this.key());
    const newSelectedKeys = new Set(list.selectedKeys());

    if (isShift) {
      const anchorKey = list.anchorKey();
      const anchorIndex = visible.findIndex(
        (visibleItem) => this.getItemKey(visibleItem, this.key()) === anchorKey,
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
        list.selectedKeys.set(newSelectedKeys);
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

    list.selectedKeys.set(newSelectedKeys);
    list.anchorKey.set(itemKey);
  }

  protected onItemKeydown(listType: ListType, index: number, event: KeyboardEvent): void {
    const visible = this.list(listType).visibleItems();

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
    if (index < 0 || index >= this.list(listType).visibleItems().length) {
      return;
    }

    // Ctrl/Cmd + arrows move focus without disturbing the current selection.
    if (!event.ctrlKey && !event.metaKey) {
      this.onItemClick(listType, index, event as unknown as MouseEvent);
    }

    this.focusItem(listType, index);
  }

  private focusItem(listType: ListType, index: number): void {
    this.list(listType).activeIndex.set(index);

    const elements = listType === 'available' ? this.availableItemElements() : this.selectedItemElements();
    elements[index]?.nativeElement.focus();
  }

  private jumpToTypedItem(listType: ListType, character: string): void {
    if (this.typeAheadTimeoutId !== null) {
      clearTimeout(this.typeAheadTimeoutId);
    }

    // The buffer is shared, so typing into the other list starts a new search rather than
    // continuing the one from the list the user left.
    if (this.typeAheadListType !== listType) {
      this.typeAheadBuffer = '';
      this.typeAheadListType = listType;
    }

    this.typeAheadBuffer += character.toLowerCase();
    this.typeAheadTimeoutId = setTimeout(() => {
      this.typeAheadBuffer = '';
      this.typeAheadListType = null;
      this.typeAheadTimeoutId = null;
    }, typeAheadResetTimeout);

    const visible = this.list(listType).visibleItems();
    const matchIndex = visible.findIndex(
      (item) => this.getDisplayValue(item).toLowerCase().startsWith(this.typeAheadBuffer),
    );

    if (matchIndex === -1) {
      return;
    }

    // Type-ahead moves focus only: in a multi-selectable listbox it must not discard a
    // selection the user built up with Ctrl-click.
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
    const items = this.availableList.visibleItems();
    this.transferItems('available', 'selected', items);
    this.announceMove(items.length, this.targetName(), true);
  }

  protected moveAllLeft(): void {
    const items = this.selectedList.visibleItems();
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
    const list = this.list(listType);
    const selectedKeys = list.selectedKeys();
    return list.items().filter((item) => selectedKeys.has(this.getItemKey(item, this.key())));
  }

  private transferItems(fromType: ListType, toType: ListType, itemsToMove: T[]): void {
    if (!itemsToMove.length) {
      return;
    }

    const fromList = this.list(fromType);
    const toList = this.list(toType);
    const movedKeys = new Set(itemsToMove.map((item) => this.getItemKey(item, this.key())));

    this.resetList(fromList, fromList.items().filter((item) => !movedKeys.has(this.getItemKey(item, this.key()))));
    this.resetList(toList, [...toList.items(), ...itemsToMove]);

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
    const list = this.list(listType);
    const items = list.items();
    const visible = list.visibleItems();
    const newItems = [...items];

    moveItemInArray(
      newItems,
      this.absoluteIndex(items, visible, previousIndex),
      this.absoluteIndex(items, visible, currentIndex),
    );

    list.items.set(newItems);

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
    const fromList = this.list(fromType);
    const toList = this.list(toType);
    const item = fromList.visibleItems()[previousIndex];

    if (!item) {
      return;
    }

    const itemKey = this.getItemKey(item, this.key());
    const newToItems = [...toList.items()];
    newToItems.splice(this.absoluteIndex(toList.items(), toList.visibleItems(), currentIndex), 0, item);

    this.resetList(
      fromList,
      fromList.items().filter((fromItem) => this.getItemKey(fromItem, this.key()) !== itemKey),
    );
    this.resetList(toList, newToItems);

    this.updateDestination();
    this.announceMove(1, toType === 'selected' ? this.targetName() : this.sourceName());
  }

  private updateDestination(): void {
    this.destination.set(this.selectedList.items());
  }
}
