import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NgClass, NgStyle } from '@angular/common';
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
import { MatIconButton } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DetectBrowserService } from 'app/services/detect-browser.service';

interface ListState<T> {
  items: T[];
  selectedIndices: Set<number>;
  lastSelectedIndex: number | null;
}

@Component({
  selector: 'ix-dual-listbox',
  templateUrl: './dual-listbox.component.html',
  styleUrls: ['./dual-listbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgClass,
    NgStyle,
    DragDropModule,
    IxIconComponent,
    MatIconButton,
    TestDirective,
    MatTooltip,
    MatListModule,
    TranslateModule,
  ],
})
export class DualListBoxComponent<T = Record<string, unknown>> {
  private detectBrowser = inject(DetectBrowserService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Inputs
  sourceName = input.required<string>();
  targetName = input.required<string>();
  listItemIcon = input<MarkedIcon | null>(null);
  source = input.required<T[]>();
  destination = model<T[]>([]);
  key = input<string>('id');
  display = input<string>('name');
  height = input<string>('250px');
  sort = input<boolean>(false);

  protected isMacOs = this.detectBrowser.isMacOs();

  // Public for testing
  ariaMessage = signal('');

  availableList = signal<ListState<T>>({
    items: [],
    selectedIndices: new Set(),
    lastSelectedIndex: null,
  });

  selectedList = signal<ListState<T>>({
    items: [],
    selectedIndices: new Set(),
    lastSelectedIndex: null,
  });

  // Computed values (public for testing)
  hasAvailableSelection = computed(() => this.availableList().selectedIndices.size > 0);
  hasSelectedSelection = computed(() => this.selectedList().selectedIndices.size > 0);
  canMoveAllRight = computed(() => this.availableList().items.length > 0);
  canMoveAllLeft = computed(() => this.selectedList().items.length > 0);

  private isUpdatingFromDrag = false;
  private ariaTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

      // Sort if needed
      const sortedAvailable = this.sort() ? this.sortItems(available) : available;
      const sortedSelected = this.sort() ? this.sortItems(destItems) : destItems;

      this.availableList.set({
        items: sortedAvailable,
        selectedIndices: new Set(),
        lastSelectedIndex: null,
      });

      this.selectedList.set({
        items: sortedSelected,
        selectedIndices: new Set(),
        lastSelectedIndex: null,
      });
    });

    // Clean up ARIA timeout on destroy
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

  private sortItems(items: T[]): T[] {
    return [...items].sort((a, b) => {
      const displayA = this.getItemDisplay(a, this.display());
      const displayB = this.getItemDisplay(b, this.display());
      return displayA.localeCompare(displayB);
    });
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

  protected isItemSelected(listState: ListState<T>, index: number): boolean {
    return listState.selectedIndices.has(index);
  }

  protected onItemClick(
    listType: 'available' | 'selected',
    index: number,
    event: MouseEvent,
  ): void {
    const listState = listType === 'available' ? this.availableList() : this.selectedList();
    const setList = listType === 'available' ? this.availableList : this.selectedList;

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    const newSelectedIndices = new Set(listState.selectedIndices);

    if (isShift && listState.lastSelectedIndex !== null) {
      // Shift-click: select range
      const start = Math.min(listState.lastSelectedIndex, index);
      const end = Math.max(listState.lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSelectedIndices.add(i);
      }
    } else if (isCtrlOrCmd) {
      // Ctrl/Cmd-click: toggle selection
      if (newSelectedIndices.has(index)) {
        newSelectedIndices.delete(index);
      } else {
        newSelectedIndices.add(index);
      }
    } else {
      // Regular click: select only this item
      newSelectedIndices.clear();
      newSelectedIndices.add(index);
    }

    setList.set({
      ...listState,
      selectedIndices: newSelectedIndices,
      lastSelectedIndex: index,
    });
  }

  protected onItemKeydown(listType: 'available' | 'selected', index: number, event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onItemClick(listType, index, event as unknown as MouseEvent);
    }
  }

  // Public for testing
  moveSelectedRight(): void {
    const count = this.availableList().selectedIndices.size;
    this.moveItems('available', 'selected');
    this.announceChange(`Moved ${count} item${count === 1 ? '' : 's'} to ${this.targetName()}`);
  }

  // Public for testing
  moveSelectedLeft(): void {
    const count = this.selectedList().selectedIndices.size;
    this.moveItems('selected', 'available');
    this.announceChange(`Moved ${count} item${count === 1 ? '' : 's'} to ${this.sourceName()}`);
  }

  protected moveAllRight(): void {
    const available = this.availableList();
    const selected = this.selectedList();
    const count = available.items.length;

    this.selectedList.set({
      items: [...selected.items, ...available.items],
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    this.availableList.set({
      items: [],
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    this.updateDestination();
    this.announceChange(`Moved all ${count} item${count === 1 ? '' : 's'} to ${this.targetName()}`);
  }

  protected moveAllLeft(): void {
    const available = this.availableList();
    const selected = this.selectedList();
    const count = selected.items.length;

    this.availableList.set({
      items: [...available.items, ...selected.items],
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    this.selectedList.set({
      items: [],
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    this.updateDestination();
    this.announceChange(`Moved all ${count} item${count === 1 ? '' : 's'} to ${this.sourceName()}`);
  }

  private moveItems(fromType: 'available' | 'selected', toType: 'available' | 'selected'): void {
    const fromList = fromType === 'available' ? this.availableList() : this.selectedList();
    const toList = toType === 'available' ? this.availableList() : this.selectedList();
    const setFromList = fromType === 'available' ? this.availableList : this.selectedList;
    const setToList = toType === 'available' ? this.availableList : this.selectedList;

    // Get selected items
    const selectedItems = Array.from(fromList.selectedIndices)
      .sort((a, b) => b - a) // Sort in reverse to maintain correct indices
      .map((idx) => fromList.items[idx]);

    // Remove selected items from source
    const remainingItems = fromList.items.filter((_, idx) => !fromList.selectedIndices.has(idx));

    // Add to destination
    const newToItems = [...toList.items, ...selectedItems];

    setFromList.set({
      items: remainingItems,
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    setToList.set({
      items: this.sort() ? this.sortItems(newToItems) : newToItems,
      selectedIndices: new Set(),
      lastSelectedIndex: null,
    });

    this.updateDestination();
  }

  // Public for testing
  onDrop(event: CdkDragDrop<ListState<T>>): void {
    this.isUpdatingFromDrag = true;

    if (event.previousContainer === event.container) {
      // Reorder within same list
      const listState = event.container.data;
      const newItems = [...listState.items];
      moveItemInArray(newItems, event.previousIndex, event.currentIndex);

      if (event.container.id === 'available-list') {
        this.availableList.set({
          ...listState,
          items: newItems,
        });
      } else {
        this.selectedList.set({
          ...listState,
          items: newItems,
        });
        this.updateDestination();
      }
      this.announceChange('Item reordered');
    } else {
      // Transfer between lists
      const fromList = event.previousContainer.data;
      const toList = event.container.data;

      const newFromItems = [...fromList.items];
      const newToItems = [...toList.items];
      transferArrayItem(newFromItems, newToItems, event.previousIndex, event.currentIndex);

      const targetListName = event.container.id === 'selected-list'
        ? this.targetName()
        : this.sourceName();

      if (event.previousContainer.id === 'available-list') {
        this.availableList.set({
          ...fromList,
          items: newFromItems,
          selectedIndices: new Set(),
        });
        this.selectedList.set({
          ...toList,
          items: newToItems,
          selectedIndices: new Set(),
        });
      } else {
        this.selectedList.set({
          ...fromList,
          items: newFromItems,
          selectedIndices: new Set(),
        });
        this.availableList.set({
          ...toList,
          items: newToItems,
          selectedIndices: new Set(),
        });
      }

      this.updateDestination();
      this.announceChange(`Item moved to ${targetListName}`);
    }

    // Reset flag after next render to ensure proper synchronization with Angular's change detection
    afterNextRender(() => {
      this.isUpdatingFromDrag = false;
    }, { injector: this.injector });
  }

  private updateDestination(): void {
    this.destination.set(this.selectedList().items);
  }
}
