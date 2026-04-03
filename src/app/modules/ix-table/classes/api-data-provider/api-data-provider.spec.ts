import { of } from 'rxjs';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { ApiDataProvider } from './api-data-provider';

describe('ApiDataProvider', () => {
  let dataProvider: ApiDataProvider<'vm.query'>;
  let api: { call: jest.Mock };

  beforeEach(() => {
    api = { call: jest.fn(() => of([])) };
    dataProvider = new ApiDataProvider(api as unknown as ApiService, 'vm.query');
  });

  it('resets pagination to page 1 when sorting changes', () => {
    api.call.mockReturnValue(of(3));
    dataProvider.load();

    dataProvider.setPagination({ pageNumber: 2, pageSize: 2 });
    dataProvider.setSorting({ active: 0, direction: SortDirection.Asc, propertyName: 'name' });

    expect(dataProvider.pagination.pageNumber).toBe(1);
  });

  it('does not reset pagination when it has not been initialized', () => {
    dataProvider.setSorting({ active: 0, direction: SortDirection.Asc, propertyName: 'name' });

    expect(dataProvider.pagination.pageNumber).toBeNull();
  });
});
