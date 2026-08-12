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
 * tn-select (multiselect) based column picker — the one control a tn-table list
 * uses to let users choose which columns are visible. `columns` in,
 * `columnsChange` out, `columnPreferencesKey` for persistence; a list pairs it
 * with the `toDisplayedColumns` bridge to feed `tn-table`'s `displayedColumns`.
 *
 * Only columns with a `title` are user-toggleable (an actions column has none);
 * at least one titled column always stays visible. Visibility is persisted per
 * `columnPreferencesKey` via `preferredColumnsUpdated`, keyed by column title so
 * preferences saved by earlier releases keep loading. A title is a translated
 * string, so a saved preference can stop resolving (locale switch, renamed
 * column); such a preference is treated as stale and the defaults are restored.
 *
 * A key therefore owns exactly one set of column titles: two pickers over
 * different columns must not share one (the store keeps a single entry per key,
 * so each would read the other's titles as stale and reset to defaults).
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
  // persistence key and must keep matching preferences saved by earlier
  // releases.
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
      const savedTitles = saved?.columns ?? [];
      const selectable = this.selectableTitles();
      // Titles are translated, so a locale switch (or a renamed column) leaves
      // saved titles that no longer resolve — usually only some of them, since
      // titles like "URI" are identical across locales. Applying such a
      // preference partially would silently hide every column whose title did
      // change, so any unresolved title makes the whole preference stale and
      // the defaults win.
      const isStale = savedTitles.some((title) => !selectable.includes(title));
      const visible = savedTitles.length && !isStale
        ? selectable.filter((title) => savedTitles.includes(title))
        : this.defaultVisibleTitles();
      this.applyVisibility(visible);
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
    const visible = this.selectableColumns().filter((column) => !column.hidden).map((column) => column.title);
    // A table that declares every titled column hidden would otherwise start
    // fully collapsed, and the empty-selection revert would have nothing to
    // restore. Keep one column visible.
    return visible.length ? visible : this.selectableTitles().slice(0, 1);
  }
}
