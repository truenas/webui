import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { ControllerType } from 'app/enums/controller-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { mockAuditDataProvider, mockAuditEntries } from 'app/pages/audit/utils/mock-audit-data-provider';
import { ApiService } from 'app/services/websocket/api.service';

describe('AuditSearchComponent', () => {
  let spectator: Spectator<AuditSearchComponent>;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: AuditSearchComponent,
    imports: [],
    providers: [
      mockApi([
        mockCall('audit.query', mockAuditEntries),
        mockCall('user.query'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isMobileView: false,
        controllerType: ControllerType.Active,
        dataProvider: mockAuditDataProvider,
      },
    });
    api = spectator.inject(ApiService);
  });

  it('searches by event, username and service when basic search is used', () => {
    const search = spectator.query(SearchInputComponent);
    search.query.set({
      isBasicQuery: true,
      query: 'search',
    });

    search.runSearch.emit();

    expect(api.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [['OR', [['event', '~', '(?i)search'], ['username', '~', '(?i)search'], ['service', '~', '(?i)search']]]],
        'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
        remote_controller: false,
      }],
    );
  });

  it('runs search when controller type is changed', () => {
    spectator.setInput('controllerType', ControllerType.Standby);
    spectator.detectChanges();

    expect(api.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [],
        'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
        remote_controller: true,
      }],
    );
  });

  it('applies filters to API query when advanced search is used', () => {
    const search = spectator.query<SearchInputComponent<AuditEntry>>(SearchInputComponent);
    search.query.set({
      isBasicQuery: false,
      filters: [
        ['event', '=', 'Authentication'],
        ['username', '~', 'bob'],
      ],
    });
    search.runSearch.emit();

    expect(api.call).toHaveBeenLastCalledWith(
      'audit.query',
      [{
        'query-filters': [['event', '=', 'Authentication'], ['username', '~', 'bob']],
        'query-options': { limit: 50, offset: 0, order_by: ['-message_timestamp'] },
        remote_controller: false,
      }],
    );
  });
});
