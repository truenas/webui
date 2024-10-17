import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';

class MockTranslateService {
  instant(key: string): string {
    return key;
  }
}

jest.mock('app/../assets/ui-searchable-elements.json', () => ([
  {
    hierarchy: ['search1'],
    synonyms: [],
    requiredRoles: [],
    anchorRouterLink: [],
    routerLink: null,
    anchor: 'some-anchor',
    triggerAnchor: null,
    section: GlobalSearchSection.Ui,
  },
]));

describe('GlobalSearchSectionsProvider', () => {
  let spectator: SpectatorService<GlobalSearchSectionsProvider>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };
  const createService = createServiceFactory({
    service: GlobalSearchSectionsProvider,
    mocks: [UiSearchProvider],
    providers: [
      { provide: TranslateService, useClass: MockTranslateService },
      {
        provide: WINDOW,
        useValue: {
          localStorage: mockLocalStorage,
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should fetch UI section results based on search term', () => {
    const searchTerm = 'testone'; // fuzzy search should work
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

    const results = spectator.service.getHelpSectionResults(searchTerm, appVersion);

    expect(results).toEqual([{
      hierarchy: ['Search Documentation for «{value}»'],
      targetHref: 'https://www.truenas.com/docs/scale/24.10/search/?query=feature',
      section: GlobalSearchSection.Help,
    }]);
  });

  it('should generate help section results based on search term and missing app version', () => {
    const searchTerm = 'test';
    const results = spectator.service.getHelpSectionResults(searchTerm);

    expect(results).toEqual([{
      hierarchy: ['Search Documentation for «{value}»'],
      targetHref: 'https://www.truenas.com/docs/search/?query=test',
      section: GlobalSearchSection.Help,
    }]);
  });

  it('should generate help section results based on special case search term', () => {
    const searchTerm = 'help';
    const results = spectator.service.getHelpSectionResults(searchTerm);

    expect(results).toEqual([{
      hierarchy: ['Go to Documentation'],
      targetHref: 'https://www.truenas.com/docs/search',
      section: GlobalSearchSection.Help,
    }]);
  });

  // ui-searchable-elements.json is mocked above
  it('should retrieve recent searches from localStorage and remove outdated items from local storage if any', () => {
    const recentSearches = [
      {
        hierarchy: ['search1'], // existing hierarchy
        targetHref: 'url1',
      },
      {
        hierarchy: ['search to be removed'], // non-existing hierarchy
        targetHref: 'url2',
      },
    ];

    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(recentSearches));

    const results = spectator.service.getRecentSearchesSectionResults();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('recentSearches');
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('recentSearches', JSON.stringify([recentSearches[0]]));

    expect(results).toEqual([
      {
        hierarchy: ['search1'],
        targetHref: 'url1',
        synonyms: [],
      },
    ]);
  });
});
