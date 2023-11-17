import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { SearchQuery } from 'app/modules/search-input/types/search-query.interface';

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
    delete options.sorting.sortBy;
    this.location.replaceState(`${url}/${JSON.stringify(options)}`);
  }

  parseUrlOptions<T>(options: string): UrlOptions<T> {
    return JSON.parse(options || '{}');
  }
}
