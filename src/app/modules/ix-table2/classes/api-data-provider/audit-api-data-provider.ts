import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ApiDataProvider } from 'app/modules/ix-table2/classes/api-data-provider/api-data-provider';
import { WebSocketService } from 'app/services/ws.service';

export class AuditApiDataProvider extends ApiDataProvider<'audit.query'> {
  lastQueryParams: AuditQueryParams;

  get avoidCountRowsRequest(): boolean {
    return Boolean(this.totalRows && (this.totalRows / this.pagination.pageNumber) > this.pagination.pageSize);
  }
  constructor(ws: WebSocketService) {
    super(ws, 'audit.query');
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest && _.isEqual(this.lastQueryParams, this.params[0])) {
      return of(this.totalRows);
    }

    this.lastQueryParams = this.params[0];

    const params = [
      {
        'query-filters': this.params[0] || [],
        'query-options': { count: true },
      },
    ] as ApiCallParams<'audit.query'>;

    return this.ws.call(this.method, params) as unknown as Observable<number>;
  }

  protected override prepareParams(params: ApiCallParams<'audit.query'>): ApiCallParams<'audit.query'> {
    const queryFilters = (params[0] || []) as QueryFilters<AuditEntry>;
    const queryOptions = {
      ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
      ...this.sortingStrategy.getParams(this.sorting),
    };

    return [
      {
        'query-filters': queryFilters,
        'query-options': queryOptions,
      },
    ];
  }
}
