import { Observable, of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { QueryFiltersAndOptionsApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/query-filters-and-options-data-provider';
import { ApiService } from 'app/modules/websocket/api.service';

export class AuditApiDataProvider extends QueryFiltersAndOptionsApiDataProvider<'audit.query'> {
  isHaLicensed: boolean;
  selectedControllerType: ControllerType;
  service: AuditService = AuditService.Middleware;

  private queryFilters: QueryFilters<AuditEntry> = [];

  constructor(api: ApiService) {
    super(api, 'audit.query');
  }

  /**
   * Typed entry point for filters. `this.queryFilters` is the source of truth used
   * by `prepareParams`/`countRows` to build the actual request. `this.params` is
   * kept in sync so the inherited `load()`'s `isEmpty(params[0])` check still
   * distinguishes "no records" from "no search results"; the cast is local to
   * this single line because the base treats `params[0]` as filters by convention.
   */
  setQueryFilters(filters: QueryFilters<AuditEntry>): void {
    this.queryFilters = filters;
    this.setParams([filters] as unknown as ApiCallParams<'audit.query'>);
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest) {
      return of(this.totalRows);
    }

    this.lastParams = this.params;

    const params: ApiCallParams<'audit.query'> = [{
      'query-filters': this.queryFilters,
      'query-options': { count: true },
      services: [this.service],
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];

    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected override prepareParams(): ApiCallParams<'audit.query'> {
    return [{
      'query-filters': this.queryFilters,
      'query-options': {
        ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
        ...this.sortingStrategy.getParams(this.sorting),
      },
      services: [this.service],
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];
  }
}
