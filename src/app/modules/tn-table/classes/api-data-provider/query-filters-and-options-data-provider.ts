import { CallMethod, CallParams } from '@truenas/api-client';
import { isEqual } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ApiDataProvider } from 'app/modules/tn-table/classes/api-data-provider/api-data-provider';
import { ApiQueryParams } from 'app/modules/tn-table/classes/api-data-provider/query-params';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * For methods that take filters and options as one `{ 'query-filters', 'query-options' }` object
 * rather than as two positional params. None of them is a query method, so `Row` has to be named.
 */
export class QueryFiltersAndOptionsApiDataProvider<
  M extends CallMethod<WebUiApiDirectory>,
  Row,
> extends ApiDataProvider<M, Row> {
  lastParams: QueryParams<Row>;

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

    const params: ApiQueryParams<Row>[] = [{
      'query-filters': this.params[0] || [],
      'query-options': { count: true },
    }];

    // Not `queryCount`: it sends filters and `{ count: true }` as two positional params, and
    // these methods take both in one object. `call` types the answer as rows, hence the cast.
    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected override prepareParams(params: QueryParams<Row>): CallParams<WebUiApiDirectory, M> {
    const [queryFilters = []] = params;

    const apiCallParams: ApiQueryParams<Row>[] = [{
      'query-filters': queryFilters,
      'query-options': {
        ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
        ...this.sortingStrategy.getParams(this.sorting),
      },
    }];

    return apiCallParams as CallParams<WebUiApiDirectory, M>;
  }
}
