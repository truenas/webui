import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { AdvancedSearchQuery, BasicSearchQuery, SearchQuery } from 'app/modules/search-input/types/search-query.interface';

export interface UrlOptions<T> {
  sorting?: TableSort<T>;
  pagination?: TablePagination;
  searchQuery?: SearchQuery<T>;
}

@Injectable({ providedIn: 'root' })
export class UrlOptionsService {
  constructor(
    private location: Location,
  ) {}

  setUrlOptions<T>(url: string, options: UrlOptions<T>): void {
    delete options.sorting?.sortBy;
    if (options.sorting?.direction === null || options.sorting?.propertyName === null) {
      delete options.sorting;
    }

    if (options.pagination?.pageNumber === null || options.pagination?.pageSize === null) {
      delete options.pagination;
    }

    if (
      !(options.searchQuery as AdvancedSearchQuery<T>)?.filters?.length
        && !(options.searchQuery as BasicSearchQuery)?.query
    ) {
      delete options.searchQuery;
    }

    if (Object.entries(options).length) {
      this.location.replaceState(`${url}/${encodeURIComponent(JSON.stringify(options))}`);
    }
  }

  parseUrlOptions<T>(options: string): UrlOptions<T> {
    return JSON.parse(options ? decodeURIComponent(options) : '{}');
  }
}
