import { isEqual } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { AuditEntry, AuditQueryParams } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';
import { ApiService } from 'app/modules/websocket/api.service';

export class AuditApiDataProvider extends ApiDataProvider<'audit.query'> {
  lastParams: AuditQueryParams;
  isHaLicensed: boolean;
  selectedControllerType: ControllerType;

  get isLastOffset(): boolean {
    return Boolean((this.totalRows / this.pagination.pageNumber) < this.pagination.pageSize);
  }

  get avoidCountRowsRequest(): boolean {
    return Boolean(this.totalRows) && !this.isLastOffset && isEqual(this.lastParams, this.params[0]);
  }

  constructor(api: ApiService) {
    super(api, 'audit.query');
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest) {
      return of(this.totalRows);
    }

    this.lastParams = this.params[0];

    const params: ApiCallParams<'audit.query'> = [{
      'query-filters': (this.params[0] || []) as QueryFilters<AuditEntry>,
      'query-options': { count: true },
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];

    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected override prepareParams(params: ApiCallParams<'audit.query'>): ApiCallParams<'audit.query'> {
    const [queryFilters = []] = params as [QueryFilters<AuditEntry>];

    const apiCallParams: ApiCallParams<'audit.query'> = [{
      'query-filters': queryFilters,
      'query-options': {
        ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
        ...this.sortingStrategy.getParams(this.sorting),
      },
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];

    return apiCallParams;
  }
}
