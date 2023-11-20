import { map, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallDirectory, ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { BaseDataProvider, paginate, sort } from 'app/modules/ix-table2/base-data-provider';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { WebSocketService } from 'app/services/ws.service';

// TODO: Extract to separate files
// TODO: Replace with QueryParams?
interface ApiCallParams { [key: string]: unknown }

interface PaginationStrategy {
  getParams(pagination: TablePagination): ApiCallParams;
  paginate<T>(rows: T[], pagination: TablePagination): T[];
  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void;
}

interface SortingStrategy {
  getParams<T>(sorting: TableSort<T>): ApiCallParams;
  sort<T>(rows: T[], sorting: TableSort<T>): T[];
  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void;
}

export class PaginationClientSide implements PaginationStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  paginate<T>(rows: T[], pagination: TablePagination): T[] {
    return paginate(rows, pagination);
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void {
    updatePage();
  }
}

export class PaginationServerSide implements PaginationStrategy {
  getParams(pagination: TablePagination): ApiCallParams {
    if (pagination.pageNumber === null || pagination.pageSize === null) {
      return {};
    }

    return  {
      offset: (pagination.pageNumber - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    };
  }

  paginate<T>(rows: T[]): T[] {
    return rows;
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}

export class SortingClientSide implements SortingStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  sort<T>(rows: T[], sorting: TableSort<T>): T[] {
    return sort(rows, sorting);
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void, updatePage: () => void): void {
    updatePage();
  }
}

export class SortingServerSide implements SortingStrategy {
  getParams<T>(sorting: TableSort<T>): ApiCallParams {
    if (sorting.propertyName === null || sorting.direction === null) {
      return {};
    }

    return  {
      order_by: [(sorting.direction === SortDirection.Desc ? '-' : '') + (sorting.propertyName as string)],
    };
  }

  sort<T>(rows: T[]): T[] {
    return rows;
  }

  handleCurrentPage(loadRowsAndUpdatePage: () => void): void {
    loadRowsAndUpdatePage();
  }
}

// TODO: Narrow down the type of M to only include .query methods
// TODO: T can be inferred from M
export class ApiDataProvider<T, M extends ApiCallMethod> extends BaseDataProvider<T> {
  paginationStrategy: PaginationStrategy;
  sortingStrategy: SortingStrategy;

  private rows: T[] = [];

  constructor(
    private ws: WebSocketService,
    private method: M,
    private params: ApiCallDirectory[M]['params'] = [],
  ) {
    super();
    this.paginationStrategy = new PaginationClientSide();
    this.sortingStrategy = new SortingClientSide();
  }

  setParams(params: ApiCallDirectory[M]['params']): void {
    this.params = params;
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
      // TODO: Do params need to be included here?
      this.ws.call(this.method, [{ 'query-options': { count: true } }]).pipe(
        switchMap((count: number) => {
          this.totalRows = count;
          return this.ws.call(this.method, this.prepareParams(this.params));
        }),
        map((rows: T[]) => {
          return this.paginationStrategy.paginate<T>(
            this.sortingStrategy.sort<T>(rows, this.sorting),
            this.pagination,
          );
        }),
      ).subscribe({
        next: (rows) => {
          this.rows = rows;
          this.currentPage$.next(this.rows);
          this.emptyType$.next(rows.length ? EmptyType.NoSearchResults : EmptyType.NoPageData);
        },
        error: (error: WebsocketError) => {
          console.error(this.method, error);
          this.totalRows = 0;
          this.rows = [];
          this.currentPage$.next([]);
          this.emptyType$.next(EmptyType.Errors);
        },
      }),
    );
  }

  setSorting(sorting: TableSort<T>): void {
    this.sorting = sorting;
    this.sortingStrategy.handleCurrentPage(
      () => this.load(),
      () => this.updateCurrentPage(this.rows),
    );
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.paginationStrategy.handleCurrentPage(
      () => this.load(),
      () => this.updateCurrentPage(this.rows),
    );
  }

  private prepareParams(params: ApiCallDirectory[M]['params']): ApiCallDirectory[M]['params'] {
    // TODO: Current merge is not entirely correct. Introduce a separate function.
    // TODO: Clarify whether we should use positional arguments or 'query-filters'
    return [
      {
        'query-filters': (params as unknown as QueryFilters<T>)[0] || [],
        'query-options': {
          ...this.paginationStrategy.getParams(this.pagination),
          ...this.sortingStrategy.getParams(this.sorting),
        },
      },
    ] as unknown as ApiCallDirectory[M]['params'];
  }
}
