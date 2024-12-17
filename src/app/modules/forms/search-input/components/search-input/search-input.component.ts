import {
  ChangeDetectionStrategy,
  Component, input, model,
  OnChanges, output, viewChild,
} from '@angular/core';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { SearchProperty } from 'app/modules/forms/search-input/types/search-property.interface';
import {
  AdvancedSearchQuery,
  SearchQuery,
} from 'app/modules/forms/search-input/types/search-query.interface';

@Component({
  selector: 'ix-search-input2',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AdvancedSearchComponent, BasicSearchComponent],
})
export class SearchInputComponent<T> implements OnChanges {
  readonly allowAdvanced = input(true);
  readonly properties = input<SearchProperty<T>[]>([]);
  readonly query = model<SearchQuery<T>>();
  readonly advancedSearchPlaceholder = input<string>();

  readonly queryChange = output<SearchQuery<T>>();
  readonly runSearch = output();

  // TODO: Outside of scope for this component. Solve elsewhere.
  readonly advancedSearch = viewChild('advancedSearch', { read: AdvancedSearchComponent });

  ngOnChanges(): void {
    this.selectModeFromQuery();
  }

  protected isInAdvancedMode = false;

  protected toggleAdvancedMode(): void {
    this.isInAdvancedMode = !this.isInAdvancedMode;
    this.updateQuery();
  }

  protected basicQuery: string;
  protected advancedQuery: QueryFilters<T> = [];

  protected basicSearchUpdated(query: string): void {
    this.basicQuery = query;
    this.updateQuery();
    this.queryChange.emit(this.query());
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
