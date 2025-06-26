import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef, input,
  OnInit, output, signal, Signal, viewChild,
} from '@angular/core';
import { MatCard } from '@angular/material/card';
import { MatCalendar } from '@angular/material/datepicker';
import { MatTooltip } from '@angular/material/tooltip';
import {
  autocompletion, closeBrackets, CompletionContext, startCompletion,
} from '@codemirror/autocomplete';
import { linter } from '@codemirror/lint';
import { EditorState, StateEffect, StateField } from '@codemirror/state';
import {
  EditorView, keymap, placeholder,
} from '@codemirror/view';
import { TranslateModule } from '@ngx-translate/core';
import { format } from 'date-fns';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';
import { FilterPresetsComponent } from 'app/modules/forms/search-input/components/filter-presets/filter-presets.component';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryParsingError } from 'app/modules/forms/search-input/services/query-parser/query-parsing-result.interface';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

const setDiagnostics = StateEffect.define<unknown[] | null>();

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    IxIconComponent,
    MatCard,
    MatCalendar,
    TestDirective,
    TranslateModule,
    AsyncPipe,
    FilterPresetsComponent,
  ],
})
export class AdvancedSearchComponent<T> implements OnInit {
  readonly query = input<QueryFilters<T>>([]);
  readonly filterPresets = input<FilterPreset<T>[]>([]);
  readonly properties = input<SearchProperty<T>[]>([]);
  readonly placeholder = input('');

  readonly paramsChange = output<QueryFilters<T>>();
  readonly switchToBasic = output();
  readonly runSearch = output();

  private readonly inputArea: Signal<ElementRef<HTMLElement>> = viewChild.required('inputArea', { read: ElementRef });

  protected hasQueryErrors = false;
  protected queryInputValue: string;
  errorMessages: QueryParsingError[] | null = null;
  protected editorView: EditorView;

  protected showDatePicker$ = this.advancedSearchAutocomplete.showDatePicker$;

  get editorHasValue(): boolean {
    return this.editorView?.state?.doc?.length > 0;
  }

  readonly selectedPresetLabels = signal<Set<string>>(new Set());

  constructor(
    private queryParser: QueryParserService<T>,
    private queryToApi: QueryToApiService<T>,
    private advancedSearchAutocomplete: AdvancedSearchAutocompleteService<T>,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.initEditor();
    this.advancedSearchAutocomplete.setProperties(this.properties());
    this.advancedSearchAutocomplete.setEditorView(this.editorView);

    if (this.query()) {
      this.replaceEditorContents(
        this.queryParser.formatFiltersToQuery(this.query(), this.properties()),
      );
    }
  }

  startSuggestionsCompletion(): void {
    startCompletion(this.editorView);
  }

  initEditor(): void {
    const updateListener = EditorView.updateListener.of((update) => {
      if (!update.docChanged) {
        return;
      }

      this.onInputChanged();
    });

    const diagnosticField = StateField.define({
      create() {
        return [];
      },
      update(diagnostics, transaction) {
        for (const effect of transaction.effects) {
          if (effect.is(setDiagnostics)) {
            return effect.value;
          }
        }
        return diagnostics;
      },
    });

    const advancedSearchLinter = linter((view) => view.state.field(diagnosticField));

    const autocompleteExtension = autocompletion({
      override: [(context: CompletionContext) => this.advancedSearchAutocomplete.getCompletions(context)],
      icons: false,
    });

    const customKeyMap = keymap.of([{
      key: 'Enter',
      run: () => {
        this.runSearch.emit();
        return true;
      },
    }]);

    this.editorView = new EditorView({
      state: EditorState.create({
        extensions: [
          autocompleteExtension,
          updateListener,
          advancedSearchLinter,
          diagnosticField,
          customKeyMap,
          EditorView.lineWrapping,
          closeBrackets(),
          placeholder(this.placeholder()),
        ],
      }),
      parent: this.inputArea().nativeElement,
    });

    this.focusInput();
  }

  hideDatePicker(): void {
    this.showDatePicker$.next(false);
  }

  dateSelected(value: string): void {
    this.appendEditorContents(`"${format(new Date(value), 'yyyy-MM-dd')}" `);
    this.focusInput();
    this.hideDatePicker();
  }

  applyPreset(filters: QueryFilters<T>[], presetLabels: Set<string>): void {
    console.info('🔧 Advanced Search - applyPreset called with:', {
      filters,
      presetLabels: Array.from(presetLabels),
      flattenedFilters: filters.flat(),
    });

    this.selectedPresetLabels.set(new Set(presetLabels));

    const currentQuery = this.editorView.state.doc.toString().trim();
    const newFilters = filters.flat();

    console.info('🔧 Advanced Search - Smart preset application:', {
      currentQuery,
      newFilters,
    });

    // Smart merge: check if current query has conflicting properties
    const updatedQuery = this.smartMergePresetFilters(currentQuery, newFilters);

    console.info('🔧 Advanced Search - Smart merge result:', {
      originalQuery: currentQuery,
      updatedQuery,
      changed: currentQuery !== updatedQuery,
    });

    this.replaceEditorContents(updatedQuery);
  }

  private smartMergePresetFilters(currentQuery: string, newFilters: QueryFilters<T>): string {
    if (!currentQuery.trim()) {
      // No existing query, just format the new filters
      const newQuery = this.queryParser.formatFiltersToQuery(newFilters, this.properties());
      console.info('🔧 Advanced Search - No existing query, using preset directly:', newQuery);
      return newQuery;
    }

    // Parse current query to get existing filters
    const parsedQuery = this.queryParser.parseQuery(currentQuery);
    if (parsedQuery.hasErrors) {
      console.info('🔧 Advanced Search - Current query has errors, appending preset');
      const presetQuery = this.queryParser.formatFiltersToQuery(newFilters, this.properties());
      return `${currentQuery} AND ${presetQuery}`;
    }

    const currentFilters = this.queryToApi.buildFilters(parsedQuery, this.properties());
    console.info('🔧 Advanced Search - Current filters extracted:', currentFilters);

    // Identify properties in new filters
    const newFilterProperties = new Set<string>();
    newFilters.forEach((filter) => {
      if (Array.isArray(filter) && filter.length === 3) {
        const [property] = filter;
        newFilterProperties.add(String(property));
      }
    });

    console.info('🔧 Advanced Search - New filter properties:', Array.from(newFilterProperties));

    // Remove existing filters that conflict with new ones
    const nonConflictingFilters = currentFilters.filter((filter) => {
      if (Array.isArray(filter) && filter.length === 3) {
        const [property] = filter;
        const hasConflict = newFilterProperties.has(String(property));
        if (hasConflict) {
          console.info('🔧 Advanced Search - Removing conflicting filter:', {
            property: String(property),
            filter,
          });
        }
        return !hasConflict;
      }
      return true;
    });

    // Combine non-conflicting existing filters with new filters
    const mergedFilters = [...nonConflictingFilters, ...newFilters];
    const mergedQuery = this.queryParser.formatFiltersToQuery(mergedFilters, this.properties());

    console.info('🔧 Advanced Search - Smart merge details:', {
      originalFilterCount: currentFilters.length,
      nonConflictingCount: nonConflictingFilters.length,
      newFilterCount: newFilters.length,
      finalFilterCount: mergedFilters.length,
      removedConflicts: currentFilters.length - nonConflictingFilters.length,
      mergedQuery,
    });

    return mergedQuery;
  }

  protected onResetInput(): void {
    this.replaceEditorContents('');
    this.focusInput();
    this.hideDatePicker();
    this.paramsChange.emit([]);
    this.selectedPresetLabels.set(new Set());
    this.runSearch.emit();
  }

  private focusInput(): void {
    this.editorView.focus();
  }

  private onInputChanged(): void {
    this.queryInputValue = this.editorView.state.doc.toString();
    console.info('🔧 Advanced Search - onInputChanged:', {
      queryInputValue: this.queryInputValue,
      timestamp: new Date().toISOString(),
    });
    const parsedQuery = this.queryParser.parseQuery(this.queryInputValue);

    queueMicrotask(() => {
      this.hasQueryErrors = Boolean(this.queryInputValue.length && parsedQuery.hasErrors);
      this.cdr.markForCheck();
      this.cdr.detectChanges();

      this.recalculateActivePresetsFromRawQuery(this.queryInputValue);

      if (parsedQuery.hasErrors && this.queryInputValue?.length) {
        console.info('🔧 Advanced Search - Query has errors:', parsedQuery.errors);
        this.errorMessages = parsedQuery.errors;
        this.editorView.dispatch({
          effects: setDiagnostics.of(
            parsedQuery.errors.filter((error) => error.from !== error.to),
          ),
        });
        return;
      }

      this.editorView.dispatch({
        effects: setDiagnostics.of([]),
      });
      this.errorMessages = null;

      const filters = this.queryToApi.buildFilters(parsedQuery, this.properties());
      const mergedFilters = this.mergeConflictingFilters(filters);

      console.info('🔧 Advanced Search - Emitting filters from onInputChanged:', {
        originalFilters: filters,
        mergedFilters,
        parsedQuery,
        queryInputValue: this.queryInputValue,
        conflictsFound: filters.length !== mergedFilters.length,
      });
      this.paramsChange.emit(mergedFilters);
    });
  }

  private replaceEditorContents(contents: string): void {
    const previousContents = this.editorView.state.doc.toString();
    console.info('🔧 Advanced Search - replaceEditorContents:', {
      previousContents,
      newContents: contents,
      timestamp: new Date().toISOString(),
    });
    this.editorView.dispatch({
      changes: { from: 0, to: this.editorView.state.doc.length, insert: contents },
      selection: { anchor: contents.length },
    });
  }

  private appendEditorContents(contents: string): void {
    this.editorView.dispatch({
      changes: { from: this.editorView.state.doc.length, insert: contents },
      selection: { anchor: this.editorView.state.doc.length + contents.length },
    });
  }

  private recalculateActivePresetsFromRawQuery(query: string): void {
    const normalizedQuery = this.normalize(query);
    const activeLabels = new Set<string>();

    console.info('🔧 Advanced Search - recalculateActivePresetsFromRawQuery:', {
      rawQuery: query,
      normalizedQuery,
      availablePresets: (this.filterPresets() || []).map((preset) => ({
        label: preset.label,
        query: preset.query,
      })),
    });

    if (!normalizedQuery || normalizedQuery.length < 2) {
      console.info('🔧 Advanced Search - Query too short, clearing active presets');
      this.selectedPresetLabels.set(activeLabels);
      return;
    }

    for (const preset of this.filterPresets() || []) {
      const presetFilters = preset.query.map((filter) => {
        return this.normalize(this.queryParser.formatFiltersToQuery([filter], this.properties()));
      });

      const hasPartialMatch = presetFilters.some((filterExpr) => {
        return normalizedQuery.includes(filterExpr) || filterExpr.includes(normalizedQuery);
      });

      console.info(`🔧 Advanced Search - Checking preset "${preset.label}":`, {
        presetFilters,
        hasPartialMatch,
        normalizedQuery,
        matches: presetFilters.map((filterExpr) => ({
          filterExpr,
          queryIncludesFilter: normalizedQuery.includes(filterExpr),
          filterIncludesQuery: filterExpr.includes(normalizedQuery),
        })),
      });

      if (hasPartialMatch) {
        activeLabels.add(preset.label);
      }
    }

    console.info('🔧 Advanced Search - Final active preset labels:', Array.from(activeLabels));
    this.selectedPresetLabels.set(activeLabels);
  }

  private mergeConflictingFilters(filters: QueryFilters<T>): QueryFilters<T> {
    console.info('🔧 Advanced Search - mergeConflictingFilters input:', filters);

    const mergedFilters: QueryFilters<T> = [];
    const propertyMap = new Map<string, { filter: QueryFilters<T>[number]; index: number }>();

    filters.forEach((filter, index) => {
      // Check if this is a simple filter array with [property, operator, value]
      if (Array.isArray(filter) && filter.length === 3) {
        const [property, operator, value] = filter;
        const propertyKey = String(property);

        console.info(`🔧 Advanced Search - Processing filter ${index}:`, {
          property: propertyKey,
          operator,
          value,
          filter,
        });

        if (propertyMap.has(propertyKey)) {
          // Conflict detected - keep the latest (current) filter
          const existing = propertyMap.get(propertyKey);
          if (!existing) return;
          console.info('🔧 Advanced Search - CONFLICT DETECTED for property:', {
            property: propertyKey,
            existingFilter: existing?.filter,
            newFilter: filter,
            keepingLatest: filter,
          });

          // Update the map with the latest filter
          propertyMap.set(propertyKey, { filter, index });
        } else {
          // No conflict, add to map
          propertyMap.set(propertyKey, { filter, index });
        }
      } else {
        // Non-standard filter, add directly
        console.info(`🔧 Advanced Search - Adding non-standard filter ${index}:`, filter);
        mergedFilters.push(filter);
      }
    });

    // Add all non-conflicting and latest conflicting filters
    const standardFilters = Array.from(propertyMap.values())
      .sort((a, b) => a.index - b.index) // Maintain original order
      .map(({ filter }) => filter);

    mergedFilters.push(...(standardFilters as QueryFilters<T>));

    console.info('🔧 Advanced Search - mergeConflictingFilters result:', {
      originalCount: filters.length,
      mergedCount: mergedFilters.length,
      removedConflicts: filters.length - mergedFilters.length,
      mergedFilters,
    });

    return mergedFilters;
  }

  private normalize(value: string): string {
    const result = value.replace(/["']/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    console.info('🔧 Advanced Search - normalize:', { input: value, output: result });
    return result;
  }
}
