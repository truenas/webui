import { map, switchMap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallMethod } from 'app/interfaces/api/api-call-directory.interface';
import { BaseDataProvider, paginateFn, sortFn } from 'app/modules/ix-table2/base-data-provider';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table2/interfaces/table-pagination.interface';
import { TableSort } from 'app/modules/ix-table2/interfaces/table-sort.interface';
import { WebSocketService } from 'app/services/ws.service';

interface ApiCallParams { [key: string]: unknown }

interface PaginationStrategy {
  getParams(pagination: TablePagination): ApiCallParams;
  paginate<T>(rows: T[], pagination: TablePagination): T[];
  handleCurrentPage(loadFn: () => void, skipLoadFn: () => void): void;
}

interface SortingStrategy {
  getParams<T>(sorting: TableSort<T>): ApiCallParams;
  sort<T>(rows: T[], sorting: TableSort<T>): T[];
  handleCurrentPage(loadFn: () => void, skipLoadFn: () => void): void;
}

export class PaginationClientSide implements PaginationStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  paginate<T>(rows: T[], pagination: TablePagination): T[] {
    return paginateFn(rows, pagination);
  }

  handleCurrentPage(loadFn: () => void, skipLoadFn: () => void): void {
    skipLoadFn();
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

  handleCurrentPage(loadFn: () => void): void {
    loadFn();
  }
}

export class SortingClientSide implements SortingStrategy {
  getParams(): ApiCallParams {
    return {};
  }

  sort<T>(rows: T[], sorting: TableSort<T>): T[] {
    return sortFn(rows, sorting);
  }

  handleCurrentPage(loadFn: () => void, skipLoadFn: () => void): void {
    skipLoadFn();
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

  handleCurrentPage(loadFn: () => void): void {
    loadFn();
  }
}

export class ApiDataProvider<T> extends BaseDataProvider<T> {
  paginationStrategy: PaginationStrategy;
  sortingStrategy: SortingStrategy;

  constructor(
    private ws: WebSocketService,
    private method: ApiCallMethod,
    private params?: ApiCallParams,
  ) {
    super();
    this.paginationStrategy = new PaginationClientSide();
    this.sortingStrategy = new SortingClientSide();
  }

  load(): void {
    this.emptyType$.next(EmptyType.Loading);
    this.subscription.add(
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
        error: () => {
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
      this.load.bind(this),
      this.skipLoad.bind(this),
    );
  }

  setPagination(pagination: TablePagination): void {
    this.pagination = pagination;
    this.paginationStrategy.handleCurrentPage(
      this.load.bind(this),
      this.skipLoad.bind(this),
    );
  }

  private skipLoad(): void {
    this.currentPage$.next(paginateFn(sortFn(this.rows, this.sorting), this.pagination));
  }

  private prepareParams(params: ApiCallParams): [ApiCallParams] {
    return [{
      ...params,
      'query-options': {
        ...this.paginationStrategy.getParams(this.pagination),
        ...this.sortingStrategy.getParams(this.sorting),
      },
    }];
  }
}
