import { CallMethod, CallParams } from '@truenas/api-client';
import { isEmpty } from 'lodash-es';
import {
  Observable, filter, switchMap, take,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { PaginationServerSide } from 'app/modules/tn-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/tn-table/classes/api-data-provider/sorting-server-side.class';
import { BaseDataProvider } from 'app/modules/tn-table/classes/base-data-provider';
import { TablePagination } from 'app/modules/tn-table/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/tn-table/interfaces/table-sort.interface';
import {
  WebUiApiDirectory, WebUiQueryEntity, WebUiQueryMethod,
} from 'app/modules/websocket/typed-api/typed-api-client.token';

/**
 * What a provider needs from an API client: `call`, with its generics erased so that both
 * `ApiService` and `TypedApiService` fit while consumers move from one to the other. The
 * provider types each response by its method `T`.
 */
export interface ApiDataProviderClient {
  call(method: string, params?: unknown): Observable<unknown>;
}

/** The row a query method returns; anything else has to name its row type itself. */
type DefaultRow<M> = M extends WebUiQueryMethod ? WebUiQueryEntity<M> : unknown;

/**
 * Pages a list method server side.
 *
 * `M` is usually a query method, whose rows default to its generated entity. Rows are typed
 * separately (`Row`) because most tables render the UI's own interface for an entity (`User`,
 * `Privilege`, …) rather than the generated one, and because a few methods page with another
 * params shape (`audit.query`, see `QueryFiltersAndOptionsApiDataProvider`) and are not query methods.
 *
 * `params` are what the table edits — filters and options over `Row`. `prepareParams` turns
 * them into the method's wire params.
 */
export class ApiDataProvider<
  M extends CallMethod<WebUiApiDirectory>,
  Row = DefaultRow<M>,
> extends BaseDataProvider<Row> {
  paginationStrategy: PaginationServerSide;
  sortingStrategy: SortingServerSide;

  protected rows: Row[] = [];

  constructor(
    protected api: ApiDataProviderClient,
    protected method: M,
    protected params: QueryParams<Row> = [],
  ) {
    super();
    this.paginationStrategy = new PaginationServerSide();
    this.sortingStrategy = new SortingServerSide();
  }

  setParams(params: QueryParams<Row>): void {
    this.params = params;
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.api.call(this.method, this.prepareParams(this.params)) as Observable<Row[]>;
        }),
      ).subscribe({
        next: (rows: Row[]) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          const isSearchApplied = !isEmpty(this.params[0]);
          if (!rows.length) {
            this.emptyType$.next(isSearchApplied ? EmptyType.NoSearchResults : EmptyType.NoPageData);
          } else {
            this.emptyType$.next(EmptyType.None);
          }
        },
        error: (error: unknown) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.rows = [];
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  /**
   * Sets the sorting configuration for the data provider.
   * @param sorting - The sorting configuration to apply
   * @param skipLoad - When true, prevents triggering a data reload. Useful during component
   *                   initialization to set multiple parameters before the first load.
   *                   Avoids race conditions by skipping the emptyType$ check and load trigger.
   */
  override setSorting(sorting: TableSort<Row>, skipLoad = false): void {
    // Skip base class updateCurrentPage — ApiDataProvider manages its own loading via sortingStrategy.
    // Note: base class still resets pagination to page 1 as a side effect, which is the desired behavior.
    super.setSorting(sorting, true);
    if (!skipLoad) {
      this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
        this.sortingStrategy.handleCurrentPage(this.load.bind(this));
      });
    }
  }

  /**
   * Sets the pagination configuration for the data provider.
   * @param pagination - The pagination configuration to apply
   * @param skipLoad - When true, prevents triggering a data reload. Useful during component
   *                   initialization to set multiple parameters before the first load.
   *                   Avoids race conditions by skipping the emptyType$ check and load trigger.
   */
  override setPagination(pagination: TablePagination, skipLoad = false): void {
    this.pagination = pagination;

    if (!skipLoad) {
      this.emptyType$.pipe(take(1), filter((value) => value !== EmptyType.Loading)).subscribe(() => {
        this.paginationStrategy.handleCurrentPage(this.load.bind(this));
      });
    }
    this.sortingOrPaginationUpdate.emit();
  }

  protected countRows(): Observable<number> {
    const params = [this.params[0] || [], { count: true }] as CallParams<WebUiApiDirectory, M>;

    return this.api.call(this.method, params) as unknown as Observable<number>;
  }

  protected prepareParams(params: QueryParams<Row>): CallParams<WebUiApiDirectory, M> {
    // TODO: Current merge is not entirely correct. Introduce a separate function.

    const queryFilters = params[0] || [];
    const queryOptions = {
      ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
      ...this.sortingStrategy.getParams(this.sorting),
    };

    return [queryFilters, queryOptions] as CallParams<WebUiApiDirectory, M>;
  }
}
