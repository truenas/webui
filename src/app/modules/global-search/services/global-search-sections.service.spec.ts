import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';

describe('GlobalSearchSectionsProvider', () => {
  let spectator: SpectatorService<GlobalSearchSectionsProvider>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  const createService = createServiceFactory({
    service: GlobalSearchSectionsProvider,
    mocks: [TranslateService, UiSearchProvider],
    providers: [
      {
        provide: WINDOW,
        useValue: {
          localStorage: mockLocalStorage,
        },
      },
    ],
  });

  beforeEach(() => spectator = createService());

  it('should fetch UI section results based on search term', () => {
    const searchTerm = 'test';
    const mockResults$ = of([{ hierarchy: ['Test one'], targetHref: '/root', section: GlobalSearchSection.Ui }]);
    spectator.inject(UiSearchProvider).search.mockReturnValue(mockResults$);

    const results$ = spectator.service.getUiSectionResults(searchTerm);

    expect(spectator.inject(UiSearchProvider).search).toHaveBeenCalledWith(
      searchTerm,
      spectator.service.globalSearchMaximumLimit,
    );

    results$.subscribe((response) => {
      expect(response).toEqual([{ hierarchy: ['Test one'], targetHref: '/root', section: '' }]);
    });
  });

  it('should generate help section results based on search term and app version', () => {
    const searchTerm = 'feature';
    const appVersion = '24.10';
    spectator.inject(TranslateService).instant.mockImplementation(() => {
      return `Search Documentation for «${searchTerm}»`;
    });

    const results = spectator.service.getHelpSectionResults(searchTerm, appVersion);

    expect(results).toEqual([{
      hierarchy: ['Search Documentation for «feature»'],
      targetHref: 'https://www.truenas.com/docs/scale/24.10/search/?query=feature',
      section: GlobalSearchSection.Help,
    }]);
  });

  it('should retrieve recent searches from localStorage', () => {
    const recentSearches = [{ hierarchy: ['search1'], targetHref: 'url1', section: '' }];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));

    const results = spectator.service.getRecentSearchesSectionResults();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('recentSearches');
    expect(results).toEqual(recentSearches);
  });
});
