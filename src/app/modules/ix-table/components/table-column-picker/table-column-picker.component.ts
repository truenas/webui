import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnSelectComponent, type TnSelectOption } from '@truenas/ui-components';
import { map, take } from 'rxjs';
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { AppState } from 'app/store';
import { preferredColumnsUpdated } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

/**
 * tn-select (multiselect) based column picker — the tn-table counterpart of the
 * mat-menu `<ix-table-columns-selector>`. Same contract (`columns` in,
 * `columnsChange` out, `columnPreferencesKey` for persistence), so a list pairs
 * it with the `toDisplayedColumns` bridge exactly like the legacy selector.
 *
 * Only columns with a `title` are user-toggleable (an actions column has none);
 * at least one titled column always stays visible. Visibility is persisted per
 * `columnPreferencesKey` via `preferredColumnsUpdated`, keyed by column title to
 * stay wire-compatible with the legacy selector's saved preferences.
 *
 * The input columns are never mutated: `columnsChange` emits copies with
 * updated `hidden` flags, and the host is expected to feed them back into
 * `[columns]` (the usual `columns` signal + `set` pattern).
 */
@Component({
  selector: 'ix-table-column-picker',
  templateUrl: './table-column-picker.component.html',
  styleUrls: ['./table-column-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TnSelectComponent, TranslateModule],
})
export class TableColumnPickerComponent<T = unknown> implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly columns = input.required<Column<T, ColumnComponent<T>>[]>();
  readonly columnPreferencesKey = input<string>();
  readonly columnsChange = output<Column<T, ColumnComponent<T>>[]>();

  protected readonly control = new FormControl<string[]>([], { nonNullable: true });

  // Label is translated for display; value stays the raw title — it is the
  // persistence key and must remain wire-compatible with the legacy selector's
  // saved preferences.
  protected readonly options = computed<TnSelectOption<string>[]>(
    () => this.selectableColumns().map((column) => ({
      value: column.title,
      label: this.translate.instant(column.title),
    })),
  );

  private lastSelected: string[] = [];

  ngOnInit(): void {
    const key = this.columnPreferencesKey();
    if (!key) {
      this.applyVisibility(this.defaultVisibleTitles());
      return;
    }

    this.store$.pipe(
      waitForPreferences,
      map((config) => config.tableDisplayedColumns?.find((columns) => columns.title === key)),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((saved) => {
      const visible = saved?.columns?.length
        ? this.selectableTitles().filter((title) => saved.columns.includes(title))
        : this.defaultVisibleTitles();
      this.applyVisibility(visible.length ? visible : this.selectableTitles().slice(0, 1));
    });
  }

  protected onSelectionChange(selected: string[]): void {
    if (!selected.length) {
      // Keep at least one column visible — revert the empty selection.
      this.control.setValue(this.lastSelected, { emitEvent: false });
      return;
    }
    this.applyVisibility(selected);
    this.saveColumnPreferences();
  }

  private applyVisibility(visibleTitles: string[]): void {
    this.lastSelected = visibleTitles;
    this.control.setValue(visibleTitles, { emitEvent: false });
    this.columnsChange.emit(this.columns().map((column) => {
      return column.title ? { ...column, hidden: !visibleTitles.includes(column.title) } : column;
    }));
  }

  private saveColumnPreferences(): void {
    const key = this.columnPreferencesKey();
    if (key) {
      this.store$.dispatch(preferredColumnsUpdated({
        tableDisplayedColumns: [{ title: key, columns: this.lastSelected }],
      }));
    }
  }

  private selectableColumns(): (Column<T, ColumnComponent<T>> & { title: string })[] {
    return this.columns().filter(
      (column): column is Column<T, ColumnComponent<T>> & { title: string } => !!column.title,
    );
  }

  private selectableTitles(): string[] {
    return this.selectableColumns().map((column) => column.title);
  }

  private defaultVisibleTitles(): string[] {
    return this.selectableColumns().filter((column) => !column.hidden).map((column) => column.title);
  }
}
