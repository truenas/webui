import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { AuditService } from 'app/enums/audit.enum';
import { AdvancedSearchQuery, BasicSearchQuery, SearchQuery } from 'app/modules/forms/search-input/types/search-query.interface';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';

export interface UrlOptions<T> {
  sorting?: TableSort<T>;
  pagination?: TablePagination;
  searchQuery?: SearchQuery<T>;
}

export interface AuditUrlOptions<T = unknown> extends UrlOptions<T> {
  service?: AuditService;
}

@Injectable({ providedIn: 'root' })
export class UrlOptionsService {
  private location = inject(Location);


  setUrlOptions<T>(url: string, options: UrlOptions<T>): void {
    const constructedUrl = this.buildUrl(url, options);
    this.location.replaceState(constructedUrl);
  }

  buildUrl<T>(url: string, options: UrlOptions<T>): string {
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

    if (!Object.entries(options).length) {
      return url;
    }

    return `${url}/${JSON.stringify(options)}`;
  }

  parseUrlOptions<T>(options?: string): UrlOptions<T> {
    return JSON.parse(options || '{}');
  }
}
