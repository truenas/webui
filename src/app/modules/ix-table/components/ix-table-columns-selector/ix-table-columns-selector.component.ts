import { CdkTrapFocus } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, model, OnChanges, OnInit, output, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnIconComponent, TnTestIdDirective } from '@truenas/ui-components';
import { cloneDeep } from 'lodash-es';
import { map, take } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxCellActionsComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { IxCellActionsWithMenuComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { AppState } from 'app/store';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

/**
 * Deliberate deviation from the tn-menu component-map entry: the column dropdown is
 * hand-rolled from a CDK connected overlay rather than `<tn-menu>`/`<tn-menu-item>`.
 * tn-menu-item renders as a plain command button (role="menuitem") and does not expose
 * the `role="menuitemcheckbox"` + `aria-checked` semantics this control needs to announce
 * each column's checked/unchecked state, nor the roving Home/End/Arrow focus management
 * implemented here. Revisit if tn-menu gains a checkbox-item variant (NAS-141021 library
 * follow-up).
 */
@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkOverlayOrigin,
    CdkConnectedOverlay,
    CdkTrapFocus,
    TnButtonComponent,
    TnIconComponent,
    TranslateModule,
    TnTestIdDirective,
  ],
})
export class IxTableColumnsSelectorComponent<T = unknown> implements OnChanges, OnInit {
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private destroyRef = inject(DestroyRef);

  readonly columns = model.required<Column<T, ColumnComponent<T>>[]>();
  readonly columnPreferencesKey = input<string>();

  readonly columnsChange = output<Column<T, ColumnComponent<T>>[]>();
  readonly isResetToDefaultDisabled = signal(true);
  protected readonly menuOpen = signal(false);

  hiddenColumns = new SelectionModel<Column<T, ColumnComponent<T>>>(true, []);
  private defaultColumns: Column<T, ColumnComponent<T>>[];

  get isOnlyOneColumnSelected(): boolean {
    return this.columns().filter((column) => !column.hidden && !!column.title).length === 1;
  }

  get isAllSelected(): boolean {
    return !this.columns().filter((column) => column.hidden && !!column.title).length;
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected openMenu(): void {
    this.menuOpen.set(true);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Roving focus between menu items with the Up/Down arrow keys. */
  protected moveFocus(event: Event, direction: 1 | -1): void {
    event.preventDefault();
    const menu = event.currentTarget as HTMLElement;
    const items = this.getFocusableItems(menu);
    if (!items.length) {
      return;
    }
    const currentIndex = items.indexOf(menu.ownerDocument.activeElement as HTMLButtonElement);
    const nextIndex = (currentIndex + direction + items.length) % items.length;
    items[nextIndex].focus();
  }

  /** Jump focus to the first/last menu item with the Home/End keys. */
  protected focusEdge(event: Event, edge: 'first' | 'last'): void {
    event.preventDefault();
    const items = this.getFocusableItems(event.currentTarget as HTMLElement);
    if (!items.length) {
      return;
    }
    (edge === 'first' ? items[0] : items[items.length - 1]).focus();
  }

  private getFocusableItems(menu: HTMLElement): HTMLButtonElement[] {
    return Array.from(menu.querySelectorAll<HTMLButtonElement>('.columns-menu__item:not([disabled])'));
  }

  constructor() {
    this.subscribeToColumnsChange();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.columns?.firstChange) {
      this.defaultColumns = cloneDeep(changes.columns.currentValue);
    }
  }

  ngOnInit(): void {
    // Ensure defaultColumns is initialized before any operations
    // This handles the edge case where ngOnInit might run before ngOnChanges
    if (!this.defaultColumns) {
      this.defaultColumns = cloneDeep(this.columns());
    }

    if (!this.columnPreferencesKey()) {
      this.setInitialState();
      return;
    }

    this.store$.pipe(
      waitForPreferences,
      map((config) => config.tableDisplayedColumns?.find((column) => column.title === this.columnPreferencesKey())),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((displayedColumns) => {
      // If no saved preferences exist, use default column visibility
      if (!displayedColumns?.columns?.length) {
        this.setInitialState();
        return;
      }

      this.columns().forEach((column) => {
        if (column instanceof IxCellActionsComponent || column instanceof IxCellActionsWithMenuComponent) return;

        // Skip columns without a title - they're not user-selectable
        // and should keep their default visibility
        if (!column.title) return;

        column.hidden = !displayedColumns.columns.includes(column.title);

        if (column.hidden) {
          this.hiddenColumns.select(column);
        }
      });

      // Enable reset button when loading from saved preferences
      // since user may want to return to defaults
      this.isResetToDefaultDisabled.set(false);

      if (displayedColumns.columns.every((column) => !this.columns().some((col) => col.title === column))) {
        this.hiddenColumns.clear();
      }
    });
  }

  toggleAll(): void {
    const selectableColumns = this.columns().filter((col) => !!col.title);

    if (this.isAllSelected) {
      this.hiddenColumns.deselect(...selectableColumns);
      this.toggle(selectableColumns[0]);
    } else {
      this.hiddenColumns.select(...selectableColumns);
    }

    selectableColumns.forEach((column) => this.toggle(column));
    this.emitColumnsChange();
  }

  isSelected(column: Column<T, ColumnComponent<T>>): boolean {
    return this.hiddenColumns.isSelected(column);
  }

  resetToDefaults(): void {
    this.setInitialState();
  }

  toggle(column: Column<T, ColumnComponent<T>>): void {
    if (this.isOnlyOneColumnSelected && !this.isSelected(column)) {
      return;
    }
    this.hiddenColumns.toggle(column);
    this.emitColumnsChange();
  }

  saveColumnPreferences(): void {
    if (this.columnPreferencesKey()) {
      this.store$.dispatch(preferredColumnsUpdated({
        tableDisplayedColumns: [{
          title: this.columnPreferencesKey(),
          columns: this.columns().filter((column) => !column.hidden && column.title).map((column) => column.title),
        }],
      }));
    }
  }

  enableResetButton(): void {
    this.isResetToDefaultDisabled.set(false);
  }

  private setInitialState(): void {
    this.columns.set(cloneDeep(this.defaultColumns));
    this.hiddenColumns.select(...this.columns());

    this.defaultColumns.forEach((column, index) => {
      if (!column.hidden) {
        this.toggle(this.columns()[index]);
      }
    });

    this.isResetToDefaultDisabled.set(true);
    this.emitColumnsChange();
  }

  private subscribeToColumnsChange(): void {
    this.hiddenColumns.changed.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.columns().forEach((column) => {
        column.hidden = this.hiddenColumns.isSelected(column);
      });

      this.emitColumnsChange();
    });
  }

  private emitColumnsChange(): void {
    this.columnsChange.emit([...this.columns()]);
    this.cdr.markForCheck();
  }
}
