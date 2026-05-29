import { of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';

describe('AuditApiDataProvider', () => {
  let dataProvider: AuditApiDataProvider;
  let api: { call: jest.Mock };

  beforeEach(() => {
    api = { call: jest.fn(() => of([])) };
    dataProvider = new AuditApiDataProvider(api as unknown as ApiService);
  });

  it('throws on direct setParams() so callers cannot desync the typed filters', () => {
    expect(() => dataProvider.setParams()).toThrow(
      'AuditApiDataProvider.setParams() is not supported. Use setQueryFilters() instead.',
    );
  });

  // The setParams() override is a runtime-only contract (see the class TODO): if any
  // inherited lifecycle method ever routed through `this.setParams`, it would throw.
  // These calls would explode rather than complete if that regression were introduced.
  it('does not route inherited lifecycle methods through the throwing setParams override', () => {
    api.call.mockReturnValueOnce(of(3));
    api.call.mockReturnValueOnce(of([]));

    expect(() => {
      dataProvider.setQueryFilters([]);
      dataProvider.setSorting(
        { active: 0, direction: SortDirection.Desc, propertyName: 'message_timestamp' },
        true,
      );
      dataProvider.setPagination({ pageNumber: 1, pageSize: 50 }, true);
      dataProvider.load();
    }).not.toThrow();
  });

  it('feeds the filters from setQueryFilters into the request', () => {
    const filters = [['username', '~', 'admin']] as QueryFilters<AuditEntry>;
    api.call.mockReturnValueOnce(of(1));
    api.call.mockReturnValueOnce(of([]));

    dataProvider.setQueryFilters(filters);
    dataProvider.load();

    expect(api.call).toHaveBeenNthCalledWith(1, 'audit.query', [{
      'query-filters': filters,
      'query-options': { count: true },
      services: [AuditService.Middleware],
    }]);
  });

  it('keeps params in sync so an empty result with filters reads as NoSearchResults', () => {
    api.call.mockReturnValueOnce(of(0));
    api.call.mockReturnValueOnce(of([]));
    dataProvider.setQueryFilters([['username', '~', 'admin']] as QueryFilters<AuditEntry>);

    let emptyType: EmptyType | undefined;
    dataProvider.emptyType$.subscribe((type) => {
      emptyType = type;
    });
    dataProvider.load();

    expect(emptyType).toBe(EmptyType.NoSearchResults);
  });

  it('reads an empty result without filters as NoPageData', () => {
    api.call.mockReturnValueOnce(of(0));
    api.call.mockReturnValueOnce(of([]));
    dataProvider.setQueryFilters([]);

    let emptyType: EmptyType | undefined;
    dataProvider.emptyType$.subscribe((type) => {
      emptyType = type;
    });
    dataProvider.load();

    expect(emptyType).toBe(EmptyType.NoPageData);
  });
});
