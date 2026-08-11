import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { NgStyle } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnIconButtonComponent, TnIconComponent, TnInputComponent, TnListComponent, TnListIconDirective,
  TnListItemComponent, tnIconMarker,
} from '@truenas/ui-components';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { DualListBoxSide, ListType, SelectionModifiers } from 'app/modules/lists/dual-listbox/dual-listbox-side';
import { translatedSignal } from 'app/modules/translate/translated-signal';

/** How long a type-ahead buffer stays alive between keystrokes. */
const typeAheadResetTimeout = 800;

/**
 * One list of a dual listbox, with its own search field, sort toggle and keyboard navigation.
 * Owned by {@link DualListBoxComponent}, which holds the state both sides share and moves
 * items between them.
 */
@Component({
  selector: 'ix-dual-listbox-side',
  templateUrl: './dual-listbox-side.component.html',
  styleUrls: ['./dual-listbox-side.component.scss'],
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
export class DualListBoxSideComponent<T> {
  private destroyRef = inject(DestroyRef);

  side = input.required<DualListBoxSide<T>>();
  listType = input.required<ListType>();
  listName = input.required<string>();
  listItemIcon = input<string | null>(null);
  height = input<string>('250px');
  /** Sorts the list alphabetically and shows a sort-direction toggle above it. */
  sortable = input<boolean>(false);
  /** Shows a search field above the list. */
  searchable = input<boolean>(true);

  readonly dropped = output<CdkDragDrop<T[]>>();

  protected countLabel = translatedSignal((translate) => {
    const shown = this.side().visibleItems().length;
    const total = this.side().items().length;

    if (shown === total) {
      return String(total);
    }

    return translate.instant('{shown} of {total}', { shown, total });
  });

  protected sortIcon = computed(() => (
    this.side().sortDirection() === SortDirection.Asc
      ? tnIconMarker('sort-alphabetical-ascending', 'mdi')
      : tnIconMarker('sort-alphabetical-descending', 'mdi')
  ));

  protected sortLabel = translatedSignal((translate: TranslateService) => (
    this.side().sortDirection() === SortDirection.Asc
      ? translate.instant('Sorted A to Z. Click to sort Z to A.')
      : translate.instant('Sorted Z to A. Click to sort A to Z.')
  ));

  private itemElements = viewChildren('listItem', { read: ElementRef<HTMLElement> });
  private searchField = viewChild(TnInputComponent);

  private typeAheadBuffer = '';
  private typeAheadTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.typeAheadTimeoutId !== null) {
        clearTimeout(this.typeAheadTimeoutId);
      }
    });
  }

  protected trackByKey(index: number, item: T): unknown {
    return this.side().keyOf(item);
  }

  /** Moves focus to the item with this key. Returns false when the list is not showing it. */
  focusKey(key: unknown): boolean {
    const index = this.side().visibleItems().findIndex((item) => this.side().keyOf(item) === key);

    if (index === -1) {
      return false;
    }

    this.focusItem(index);
    return true;
  }

  /** Moves focus to the list's tab stop. Returns false when the list has nothing to focus. */
  focusTabStop(): boolean {
    if (!this.side().visibleItems().length) {
      return false;
    }

    this.focusItem(this.side().tabStop());
    return true;
  }

  /**
   * Moves focus to the list's search field — the last place to put focus when the list itself
   * shows nothing, since clearing the search is what brings the items back. Returns false when
   * the list has no search field.
   */
  focusSearch(): boolean {
    const searchField = this.searchField();

    if (!searchField) {
      return false;
    }

    searchField.inputEl().nativeElement.focus();
    return true;
  }

  protected onItemClick(index: number, event: MouseEvent): void {
    this.side().select(index, this.modifiersOf(event));
  }

  protected onItemKeydown(index: number, event: KeyboardEvent): void {
    const visible = this.side().visibleItems();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusAndSelect(Math.min(index + 1, visible.length - 1), event);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.focusAndSelect(Math.max(index - 1, 0), event);
        return;
      case 'Home':
        event.preventDefault();
        this.focusAndSelect(0, event);
        return;
      case 'End':
        event.preventDefault();
        this.focusAndSelect(visible.length - 1, event);
        return;
      case ' ':
        event.preventDefault();
        this.side().select(index, { ctrl: true, shift: false });
        return;
      case 'Enter':
        this.side().select(index, this.modifiersOf(event));
        return;
      default:
        break;
    }

    // Type-ahead: typing jumps to the first item starting with what was typed.
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.jumpToTypedItem(event.key);
    }
  }

  private modifiersOf(event: MouseEvent | KeyboardEvent): SelectionModifiers {
    return { ctrl: event.ctrlKey || event.metaKey, shift: event.shiftKey };
  }

  private focusAndSelect(index: number, event: KeyboardEvent): void {
    if (index < 0 || index >= this.side().visibleItems().length) {
      return;
    }

    const modifiers = this.modifiersOf(event);

    // Ctrl/Cmd + arrows move focus without disturbing the current selection.
    if (!modifiers.ctrl) {
      this.side().select(index, modifiers);
    }

    this.focusItem(index);
  }

  private focusItem(index: number): void {
    this.side().activeIndex.set(index);
    this.itemElements()[index]?.nativeElement.focus();
  }

  private jumpToTypedItem(character: string): void {
    if (this.typeAheadTimeoutId !== null) {
      clearTimeout(this.typeAheadTimeoutId);
    }

    this.typeAheadBuffer += character.toLowerCase();
    this.typeAheadTimeoutId = setTimeout(() => {
      this.typeAheadBuffer = '';
      this.typeAheadTimeoutId = null;
    }, typeAheadResetTimeout);

    const matchIndex = this.side().visibleItems().findIndex(
      (item) => this.side().displayOf(item).toLowerCase().startsWith(this.typeAheadBuffer),
    );

    if (matchIndex === -1) {
      return;
    }

    // Type-ahead moves focus only: in a multi-selectable listbox it must not discard a
    // selection the user built up with Ctrl-click.
    this.focusItem(matchIndex);
  }
}
