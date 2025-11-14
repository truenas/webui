import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, model, OnChanges, OnInit, output, signal, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { cloneDeep } from 'lodash-es';
import { map, take } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxCellActionsComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { IxCellActionsWithMenuComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-table-columns-selector',
  templateUrl: './ix-table-columns-selector.component.html',
  styleUrls: ['./ix-table-columns-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenuTrigger,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    TranslateModule,
    TestDirective,
  ],
})
export class IxTableColumnsSelectorComponent<T = unknown> implements OnChanges, OnInit {
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);

  readonly columns = model.required<Column<T, ColumnComponent<T>>[]>();
  readonly columnPreferencesKey = input<string>();

  readonly columnsChange = output<Column<T, ColumnComponent<T>>[]>();
  readonly isResetToDefaultDisabled = signal(true);

  hiddenColumns = new SelectionModel<Column<T, ColumnComponent<T>>>(true, []);
  private defaultColumns: Column<T, ColumnComponent<T>>[];

  get isOnlyOneColumnSelected(): boolean {
    return this.columns().filter((column) => !column.hidden && !!column.title).length === 1;
  }

  get isAllSelected(): boolean {
    return !this.columns().filter((column) => column.hidden && !!column.title).length;
  }

  constructor() {
    this.subscribeToColumnsChange();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.columns?.firstChange) {
      this.defaultColumns = changes.columns.currentValue;
    }
  }

  ngOnInit(): void {
    if (!this.columnPreferencesKey()) {
      this.setInitialState();
      return;
    }

    this.store$.pipe(
      waitForPreferences,
      map((config) => config.tableDisplayedColumns?.find((column) => column.title === this.columnPreferencesKey())),
      take(1),
      untilDestroyed(this),
    ).subscribe((displayedColumns) => {
      // If no saved preferences exist, use default column visibility
      if (!displayedColumns?.columns?.length) {
        this.setInitialState();
        return;
      }

      this.columns().forEach((column) => {
        if (column instanceof IxCellActionsComponent || column instanceof IxCellActionsWithMenuComponent) return;

        column.hidden = !displayedColumns.columns.includes(column.title);

        if (column.hidden) {
          this.hiddenColumns.select(column);
        }
      });

      if (displayedColumns.columns.every((column) => !this.columns().some((col) => col.title === column))) {
        this.hiddenColumns.clear();
      }
    });
  }

  toggleAll(): void {
    if (this.isAllSelected) {
      this.hiddenColumns.deselect(...this.columns());
      this.toggle(this.columns()[0]);
    } else {
      this.hiddenColumns.select(...this.columns());
    }

    this.columns().forEach((_cell, index) => this.toggle(this.columns()[index]));
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
          columns: this.columns().filter((column) => !column.hidden).map((column) => column.title),
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
    this.hiddenColumns.changed.pipe(untilDestroyed(this)).subscribe(() => {
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
