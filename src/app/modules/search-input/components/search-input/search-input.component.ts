import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';
import {
  AdvancedSearchQuery,
  SearchQuery,
} from 'app/modules/search-input/types/search-query.interface';

@Component({
  selector: 'ix-search-input2',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent<T> implements OnChanges {
  @Input() allowAdvanced = true;
  @Input() properties: SearchProperty<T>[] = [];
  @Input() query: SearchQuery<T>;

  @Output() queryChange = new EventEmitter<SearchQuery<T>>();

  ngOnChanges(): void  {
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

  protected advancedSearchUpdated(filters: QueryFilters<T>): void {
    this.advancedQuery = filters;
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
    } else if (this.allowAdvanced) {
      this.isInAdvancedMode = true;
      this.advancedQuery = (this.query as AdvancedSearchQuery<T>).filters;
    }
  }
}
