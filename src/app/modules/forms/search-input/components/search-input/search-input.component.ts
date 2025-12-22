import {
  ChangeDetectionStrategy,
  Component, input, model,
  OnChanges, OnDestroy, output, viewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import {
  AdvancedSearchQuery,
  SearchQuery,
} from 'app/modules/forms/search-input/types/search-query.interface';

@Component({
  selector: 'ix-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdvancedSearchComponent, BasicSearchComponent],
})
export class SearchInputComponent<T> implements OnChanges, OnDestroy {
  readonly allowAdvanced = input(true);
  readonly advancedOnly = input(false);
  readonly properties = input<SearchProperty<T>[]>([]);
  readonly filterPresets = input<FilterPreset<T>[]>([]);
  readonly query = model.required<SearchQuery<T>>();
  readonly advancedSearchPlaceholder = input<string>('');

  readonly queryChange = output<SearchQuery<T>>();
  readonly runSearch = output();

  // TODO: Outside of scope for this component. Solve elsewhere.
  readonly advancedSearch = viewChild('advancedSearch', { read: AdvancedSearchComponent<T> });

  private basicSearchSubject$ = new Subject<string>();

  constructor() {
    // Debounce basic search input and auto-trigger search
    this.basicSearchSubject$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.runSearch.emit();
    });
  }

  ngOnChanges(): void {
    this.selectModeFromQuery();
  }

  ngOnDestroy(): void {
    this.basicSearchSubject$.complete();
  }

  protected isInAdvancedMode = false;

  protected toggleAdvancedMode(): void {
    this.isInAdvancedMode = !this.isInAdvancedMode;
    this.updateQuery();
    this.queryChange.emit(this.query());
  }

  protected basicQuery: string;
  protected advancedQuery: QueryFilters<T> = [];

  protected basicSearchUpdated(query: string): void {
    this.basicQuery = query;
    this.updateQuery();
    this.queryChange.emit(this.query());
    // Trigger debounced search
    this.basicSearchSubject$.next(query);
  }

  protected advancedSearchUpdated(query: QueryFilters<T>): void {
    this.advancedQuery = query;
    this.updateQuery();
    this.queryChange.emit(this.query());
  }

  private updateQuery(): void {
    if (this.isInAdvancedMode) {
      this.query.set({
        filters: this.advancedQuery,
        isBasicQuery: false,
      });
    } else {
      this.query.set({
        query: this.basicQuery,
        isBasicQuery: true,
      });
    }
  }

  private selectModeFromQuery(): void {
    const query = this.query();
    // Force advanced mode if advancedOnly is set
    if (this.advancedOnly()) {
      this.isInAdvancedMode = true;
      this.advancedQuery = query && !query.isBasicQuery ? (query as AdvancedSearchQuery<T>).filters : [];
      return;
    }

    if (!query) {
      this.isInAdvancedMode = false;
    } else if (query.isBasicQuery) {
      this.isInAdvancedMode = false;
      this.basicQuery = query.query;
    } else if (this.allowAdvanced()) {
      this.isInAdvancedMode = true;
      this.advancedQuery = (query as AdvancedSearchQuery<T>).filters;
    }
  }
}
