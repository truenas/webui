import { Observable, of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { QueryFiltersAndOptionsApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/query-filters-and-options-data-provider';
import { ApiService } from 'app/modules/websocket/api.service';

export class AuditApiDataProvider extends QueryFiltersAndOptionsApiDataProvider<'audit.query'> {
  private static instanceCounter = 0;
  private instanceId = ++AuditApiDataProvider.instanceCounter;

  isHaLicensed: boolean;
  selectedControllerType: ControllerType;
  service: AuditService = AuditService.Middleware;
  isInitializing = true;

  constructor(api: ApiService) {
    super(api, 'audit.query');
  }

  override load(): void {
    if (this.isInitializing) {
      return;
    }
    super.load();
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest) {
      return of(this.totalRows);
    }

    this.lastParams = this.params;

    const params: ApiCallParams<'audit.query'> = [{
      'query-filters': (this.params[0] || []) as QueryFilters<AuditEntry>,
      'query-options': { count: true },
      services: [this.service],
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
      services: [this.service],
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];

    return apiCallParams;
  }
}
