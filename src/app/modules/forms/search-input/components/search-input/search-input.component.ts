import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges, output,
  viewChild,
  input,
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
  imports: [AdvancedSearchComponent, BasicSearchComponent],
})
export class SearchInputComponent<T> implements OnChanges {
  readonly allowAdvanced = input(true);
  readonly properties = input<SearchProperty<T>[]>([]);
  @Input() query: SearchQuery<T>;
  readonly advancedSearchPlaceholder = input<string>(undefined);

  readonly queryChange = output<SearchQuery<T>>();
  readonly runSearch = output();

  readonly advancedSearch = viewChild<AdvancedSearchComponent<T>>('advancedSearch');

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
    this.queryChange.emit(this.query);
  }

  protected advancedSearchUpdated(query: QueryFilters<T>): void {
    this.advancedQuery = query;
    this.updateQuery();
    this.queryChange.emit(this.query);
  }

  private updateQuery(): void {
    if (this.isInAdvancedMode) {
      this.query = {
        filters: this.advancedQuery,
        isBasicQuery: false,
      };
    } else {
      this.query = {
        query: this.basicQuery,
        isBasicQuery: true,
      };
    }
  }

  private selectModeFromQuery(): void {
    if (!this.query) {
      this.isInAdvancedMode = false;
    } else if (this.query.isBasicQuery) {
      this.isInAdvancedMode = false;
      this.basicQuery = this.query.query;
    } else if (this.allowAdvanced()) {
      this.isInAdvancedMode = true;
      this.advancedQuery = (this.query as AdvancedSearchQuery<T>).filters;
    }
  }
}
