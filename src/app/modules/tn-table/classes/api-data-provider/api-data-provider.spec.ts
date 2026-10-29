import { of } from 'rxjs';
import { ApiDataProvider, ApiDataProviderClient } from 'app/modules/tn-table/classes/api-data-provider/api-data-provider';
import { SortDirection } from 'app/modules/tn-table/enums/sort-direction.enum';

describe('ApiDataProvider', () => {
  let dataProvider: ApiDataProvider<'pool.query'>;
  let api: { call: jest.Mock; queryCount: jest.Mock };

  beforeEach(() => {
    api = { call: jest.fn(() => of([])), queryCount: jest.fn(() => of(0)) };
    dataProvider = new ApiDataProvider(api as ApiDataProviderClient, 'pool.query');
  });

  it('resets pagination to page 1 when sorting changes', () => {
    api.queryCount.mockReturnValueOnce(of(3));
    dataProvider.load();

    expect(api.queryCount).toHaveBeenCalledWith('pool.query', []);

    dataProvider.setPagination({ pageNumber: 2, pageSize: 2 });
    dataProvider.setSorting({ active: 0, direction: SortDirection.Asc, propertyName: 'name' });

    expect(dataProvider.pagination.pageNumber).toBe(1);
  });

  it('does not reset pagination when it has not been initialized', () => {
    dataProvider.setSorting({ active: 0, direction: SortDirection.Asc, propertyName: 'name' });

    expect(dataProvider.pagination.pageNumber).toBeNull();
  });
});
