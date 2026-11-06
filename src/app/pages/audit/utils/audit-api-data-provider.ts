import { CallParams } from '@truenas/api-client';
import { Observable, of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { QueryFiltersAndOptionsApiDataProvider } from 'app/modules/tn-table/classes/api-data-provider/query-filters-and-options-data-provider';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export class AuditApiDataProvider extends QueryFiltersAndOptionsApiDataProvider<'audit.query', AuditEntry> {
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
   * distinguishes "no records" from "no search results".
   */
  setQueryFilters(filters: QueryFilters<AuditEntry>): void {
    this.queryFilters = filters;
    super.setParams([filters]);
  }

  /**
   * Blocked because direct callers would desync `queryFilters` and `params`; use `setQueryFilters`.
   * TODO(NAS-141063): this only fails at runtime. Making the base `setParams` `protected` would let
   * the compiler enforce it, but touches every data provider. Until then, the spec guards that no
   * inherited lifecycle method routes through this override.
   */
  override setParams(): never {
    throw new Error(
      'AuditApiDataProvider.setParams() is not supported. Use setQueryFilters() instead.',
    );
  }

  protected override countRows(): Observable<number> {
    if (this.avoidCountRowsRequest) {
      return of(this.totalRows);
    }

    this.lastParams = this.params;

    const params: CallParams<WebUiApiDirectory, 'audit.query'> = [{
      'query-filters': this.queryFilters,
      'query-options': { count: true },
      services: [this.service],
      ...(this.isHaLicensed && this.selectedControllerType && {
        remote_controller: this.selectedControllerType === ControllerType.Standby,
      }),
    }];

    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected override prepareParams(): CallParams<WebUiApiDirectory, 'audit.query'> {
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
