import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  input,
  model,
  signal,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { DualListBoxSide } from 'app/modules/lists/dual-listbox/dual-listbox-side';
import { DualListBoxSideComponent } from 'app/modules/lists/dual-listbox/dual-listbox-side.component';
import { DetectBrowserService } from 'app/services/detect-browser.service';

@Component({
  selector: 'ix-dual-listbox',
  templateUrl: './dual-listbox.component.html',
  styleUrls: ['./dual-listbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DragDropModule,
    DualListBoxSideComponent,
    TnIconButtonComponent,
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

  protected availableList = new DualListBoxSide<T>({ key: this.key, display: this.display, sort: this.sort });
  protected selectedList = new DualListBoxSide<T>({ key: this.key, display: this.display, sort: this.sort });

  protected canMoveAllRight = computed(() => this.availableList.visibleItems().length > 0);
  protected canMoveAllLeft = computed(() => this.selectedList.visibleItems().length > 0);

  private ariaTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isUpdatingFromDrag = false;

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
      const destIds = new Set(destItems.map((item) => this.selectedList.keyOf(item)));

      // Available items are those not in destination
      this.availableList.reset(sourceItems.filter((item) => !destIds.has(this.availableList.keyOf(item))));
      this.selectedList.reset(destItems);
    });

    // Clean up the pending announcement timeout on destroy
    this.destroyRef.onDestroy(() => {
      if (this.ariaTimeoutId !== null) {
        clearTimeout(this.ariaTimeoutId);
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

  protected moveSelectedRight(): void {
    this.moveItems(this.availableList, this.selectedList, this.availableList.selectedItems());
  }

  protected moveSelectedLeft(): void {
    this.moveItems(this.selectedList, this.availableList, this.selectedList.selectedItems());
  }

  /** Moves every item the list currently shows, so a search field narrows what "all" means. */
  protected moveAllRight(): void {
    this.moveItems(this.availableList, this.selectedList, this.availableList.visibleItems(), true);
  }

  protected moveAllLeft(): void {
    this.moveItems(this.selectedList, this.availableList, this.selectedList.visibleItems(), true);
  }

  private moveItems(from: DualListBoxSide<T>, to: DualListBoxSide<T>, itemsToMove: T[], all = false): void {
    this.transferItems(from, to, itemsToMove);
    this.announceMove(itemsToMove.length, this.nameOf(to), all);
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

  private nameOf(side: DualListBoxSide<T>): string {
    return side === this.selectedList ? this.targetName() : this.sourceName();
  }

  private transferItems(from: DualListBoxSide<T>, to: DualListBoxSide<T>, itemsToMove: T[]): void {
    if (!itemsToMove.length) {
      return;
    }

    const movedKeys = new Set(itemsToMove.map((item) => from.keyOf(item)));

    from.reset(from.items().filter((item) => !movedKeys.has(from.keyOf(item))));
    to.reset([...to.items(), ...itemsToMove]);

    this.updateDestination();
  }

  /** Maps a position within a list's visible items onto a position within its full list. */
  private absoluteIndex(side: DualListBoxSide<T>, visibleIndex: number): number {
    const items = side.items();
    const visible = side.visibleItems();

    if (visibleIndex >= visible.length) {
      return items.length;
    }

    const targetKey = side.keyOf(visible[visibleIndex]);
    const index = items.findIndex((item) => side.keyOf(item) === targetKey);
    return index === -1 ? items.length : index;
  }

  protected onDrop(event: CdkDragDrop<T[]>): void {
    this.isUpdatingFromDrag = true;

    const from = this.sideOf(event.previousContainer.id);
    const to = this.sideOf(event.container.id);

    if (from === to) {
      this.reorderWithinList(from, event.previousIndex, event.currentIndex);
    } else {
      this.transferByDrag(from, to, event.previousIndex, event.currentIndex);
    }

    // Reset flag after next render to ensure proper synchronization with Angular's change detection
    afterNextRender(() => {
      this.isUpdatingFromDrag = false;
    }, { injector: this.injector });
  }

  private sideOf(dropListId: string): DualListBoxSide<T> {
    return dropListId === 'available-list' ? this.availableList : this.selectedList;
  }

  private reorderWithinList(side: DualListBoxSide<T>, previousIndex: number, currentIndex: number): void {
    const newItems = [...side.items()];

    moveItemInArray(
      newItems,
      this.absoluteIndex(side, previousIndex),
      this.absoluteIndex(side, currentIndex),
    );

    side.items.set(newItems);

    if (side === this.selectedList) {
      this.updateDestination();
    }

    this.announceChange(this.translate.instant('Item reordered'));
  }

  private transferByDrag(
    from: DualListBoxSide<T>,
    to: DualListBoxSide<T>,
    previousIndex: number,
    currentIndex: number,
  ): void {
    const item = from.visibleItems()[previousIndex];

    if (!item) {
      return;
    }

    const itemKey = from.keyOf(item);
    const newToItems = [...to.items()];
    newToItems.splice(this.absoluteIndex(to, currentIndex), 0, item);

    from.reset(from.items().filter((fromItem) => from.keyOf(fromItem) !== itemKey));
    to.reset(newToItems);

    this.updateDestination();
    this.announceMove(1, this.nameOf(to));
  }

  private updateDestination(): void {
    this.destination.set(this.selectedList.items());
  }
}
