import { isEqual } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { QueryMethods, ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters, QueryOptions } from 'app/interfaces/query-api.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { ApiQueryParams } from 'app/modules/ix-table/classes/api-data-provider/query-params';

export class QueryFiltersAndOptionsApiDataProvider<T extends QueryMethods> extends ApiDataProvider<T> {
  lastParams: ApiCallParams<T>;

  get isLastOffset(): boolean {
    return Boolean((this.totalRows / Number(this.pagination.pageNumber)) < Number(this.pagination.pageSize));
  }

  get avoidCountRowsRequest(): boolean {
    return Boolean(this.totalRows) && !this.isLastOffset && isEqual(this.lastParams, this.params);
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest) {
      return of(this.totalRows);
    }

    this.lastParams = this.params;

    this.params = this.params as Exclude<ApiCallParams<T>, void>;
    const params: ApiQueryParams<T>[] = [{
      'query-filters': (this.params[0] || []) as QueryFilters<T>,
      'query-options': { count: true } as QueryOptions<T>,
    }];

    return this.api.call(this.method, params as ApiCallParams<T>) as unknown as Observable<number>;
  }

  protected override prepareParams(params: ApiCallParams<T>): ApiCallParams<T> {
    const [queryFilters = []] = params as [QueryFilters<ApiCallParams<T>>];

    const apiCallParams: ApiCallParams<T> = [{
      'query-filters': queryFilters as QueryFilters<T>,
      'query-options': {
        ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
        ...this.sortingStrategy.getParams(this.sorting),
      } as QueryOptions<T>,
    }] as unknown as ApiCallParams<T>;

    return apiCallParams;
  }
}
