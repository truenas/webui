import { Observable, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { PaginationServerSide } from 'app/modules/ix-table2/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table2/classes/api-data-provider/sorting-server-side.class';
import { BaseDataProvider } from 'app/modules/ix-table2/classes/base-data-provider';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { WebSocketService } from 'app/services/ws.service';

export type ApiResponseType<M extends ApiCallMethod> = ApiCallDirectory[M]['response'] extends (infer U)[] ? U : never;

export type ApiParams<M extends keyof ApiCallDirectory> = ApiCallDirectory[M]['params'];

export type QueryMethods = {
  [K in keyof ApiCallDirectory]: K extends `${string}.query` ? K : never
}[keyof ApiCallDirectory];

export class ApiDataProvider<M extends QueryMethods> extends BaseDataProvider<ApiResponseType<M>> {
  paginationStrategy: PaginationServerSide;
  sortingStrategy: SortingServerSide;

  private rows: ApiResponseType<M>[] = [];

  constructor(
    protected ws: WebSocketService,
    protected method: M,
    protected params: ApiParams<M> = [],
  ) {
    super();
    this.paginationStrategy = new PaginationServerSide();
    this.sortingStrategy = new SortingServerSide();
  }

  setParams(params: ApiParams<M>): void {
    this.params = params;
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      this.countRows().pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.ws.call(this.method, this.prepareParams(this.params)) as Observable<ApiResponseType<M>[]>;
        }),
      ).subscribe({
        next: (rows: ApiResponseType<M>[]) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: (error: WebSocketError) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.rows = [];
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  setSorting(sorting: TableSort<ApiResponseType<M>>): void {
    this.sorting = sorting;
    this.sortingStrategy.handleCurrentPage(this.load.bind(this));
    this.controlsStateUpdated.emit();
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.paginationStrategy.handleCurrentPage(this.load.bind(this));
    this.controlsStateUpdated.emit();
  }

  protected countRows(): Observable<number> {
    const params = [
      (this.params as QueryFilters<ApiResponseType<M>>)[0] || [],
      { count: true },
    ] as ApiParams<M>;

    return this.ws.call(this.method, params) as unknown as Observable<number>;
  }

  protected prepareParams(params: ApiParams<M>): ApiParams<M> {
    // TODO: Current merge is not entirely correct. Introduce a separate function.
    // TODO: Clarify whether we should use positional arguments or 'query-filters'

    const queryFilters = (params as QueryFilters<ApiResponseType<M>>)[0] || [];
    const queryOptions = {
      ...this.paginationStrategy.getParams(this.pagination, this.totalRows),
      ...this.sortingStrategy.getParams(this.sorting),
    };

    return [queryFilters, queryOptions] as ApiParams<M>;
  }
}
