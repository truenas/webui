import { signal } from '@angular/core';
import {
  SpectatorService, createServiceFactory, mockProvider,
} from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsByCategory, AppsStore } from 'app/pages/apps/store/apps-store.service';

describe('AppsFilterStore', () => {
  let spectator: SpectatorService<AppsFilterStore>;

  const installedAndRecommendedApp: AvailableApp = {
    catalog: 'TRUENAS',
    installed: true,
    categories: ['storage'],
    description: 'Syncthing is a continuous file synchronization program.',
    last_update: { $date: 1683822035000 },
    name: 'syncthing',
    recommended: true,
    title: 'Syncthing',
  } as AvailableApp;

  const plexApp: AvailableApp = {
    catalog: 'TRUENAS',
    installed: false,
    categories: ['media'],
    description: 'Plex is an app',
    home: 'plex.net',
    last_update: { $date: 1683822036000 },
    name: 'plex',
    recommended: false,
    title: 'Plex',
  } as AvailableApp;
  const availableApps: AvailableApp[] = [
    { ...plexApp },
    { ...installedAndRecommendedApp },
  ];

  const createService = createServiceFactory({
    service: AppsFilterStore,
    providers: [
      mockProvider(AppsStore, {
        availableApps: signal([...availableApps]),
        appsCategories: signal(['storage', 'media']),
        recommendedApps: signal([{ ...installedAndRecommendedApp }]),
        latestApps: signal([{ ...installedAndRecommendedApp }]),
      }),
      mockProvider(ApplicationsService, {
        getAvailableApps: jest.fn(() => of(availableApps)) as () => Observable<AvailableApp[]>,
        getLatestApps: jest.fn(() => of([{ ...installedAndRecommendedApp }])) as () => Observable<AvailableApp[]>,
        convertDateToRelativeDate: jest.fn(() => '') as () => string,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('starts with no filters and no search', () => {
    expect(spectator.service.filteredApps()).toEqual([]);
    expect(spectator.service.isFilterApplied()).toBe(false);
    expect(spectator.service.isFiltering()).toBe(false);
    expect(spectator.service.filterValues()).toEqual({ categories: [], sort: null });
    expect(spectator.service.searchQuery()).toBe('');
  });

  it('returns the correct searched apps from string', () => {
    spectator.service.applySearchQuery('plex');
    expect(spectator.service.searchedApps()).toEqual([
      {
        apps: [],
        category: AppExtraCategory.NewAndUpdated,
        title: 'New & Updated Apps',
        totalApps: 0,
      },
      {
        apps: [],
        category: AppExtraCategory.Recommended,
        title: 'Recommended Apps',
        totalApps: 0,
      },
      {
        apps: [],
        category: 'storage',
        title: 'storage',
        totalApps: 0,
      },
      {
        apps: [{ ...plexApp }],
        category: 'media',
        title: 'media',
        totalApps: 1,
      },
    ]);
  });

  it('returns the correct searched apps with the name sorting', () => {
    expect(spectator.service.isFilterApplied()).toBe(false);
    spectator.service.applyFilters({
      categories: ['media'],
      sort: AppsFiltersSort.Title,
    });
    expect(spectator.service.searchedApps()).toEqual([
      {
        title: 'P',
        category: 'P',
        totalApps: 1,
        apps: [{ ...plexApp }],
      },
      {
        title: 'S',
        category: 'S',
        totalApps: 1,
        apps: [{ ...installedAndRecommendedApp }],
      },
    ] as AppsByCategory[]);
    expect(spectator.service.isFilterApplied()).toBe(true);
  });

  it('returns the correct searched and filtered apps with the update sorting', () => {
    expect(spectator.service.isFilterApplied()).toBe(false);
    spectator.service.applyFilters({
      categories: ['media'],
      sort: AppsFiltersSort.LastUpdate,
    });
    expect(spectator.service.searchedApps()).toEqual([{
      category: '',
      title: '',
      totalApps: 2,
      apps: [...availableApps],
    }]);
    expect(spectator.service.isFilterApplied()).toBe(true);
  });

  it('emits the updated search query when search query is applied', () => {
    spectator.service.applySearchQuery('plex');
    expect(spectator.service.searchQuery()).toBe('plex');
  });

  it('narrows the filtered apps down by the search query for a category view', () => {
    spectator.service.applyFilters({
      categories: ['media'],
      sort: null,
    });

    expect(spectator.service.searchedFilteredApps()).toEqual([...availableApps]);

    spectator.service.applySearchQuery('Plex');

    expect(spectator.service.searchedFilteredApps()).toEqual([{ ...plexApp }]);
  });

  it('keeps the search query when only the category filters are reset', () => {
    spectator.service.applySearchQuery('plex');
    spectator.service.applyFilters({
      categories: ['media'],
      sort: null,
    });

    spectator.service.resetFiltersKeepingSearch();

    expect(spectator.service.searchQuery()).toBe('plex');
    expect(spectator.service.filteredApps()).toEqual([]);
    expect(spectator.service.isFilterApplied()).toBe(false);
    expect(spectator.service.filterValues()).toEqual({ categories: [], sort: null });
  });

  it('emits the correct filter values when they are updated', () => {
    spectator.service.applyFilters({
      categories: ['storage'],
      sort: AppsFiltersSort.Title,
    });
    expect(spectator.service.filterValues()).toEqual({
      categories: ['storage'],
      sort: AppsFiltersSort.Title,
    } as AppsFiltersValues);
  });

  it('emits apps grouped by categories for dashboard', () => {
    expect(spectator.service.appsByCategories()).toEqual([
      {
        apps: [
          { ...installedAndRecommendedApp, categories: ['storage', AppExtraCategory.NewAndUpdated] },
        ],
        category: AppExtraCategory.NewAndUpdated,
        title: 'New & Updated Apps',
        totalApps: 1,
      },
      {
        apps: [
          { ...installedAndRecommendedApp, categories: ['storage', AppExtraCategory.Recommended] },
        ],
        category: AppExtraCategory.Recommended,
        title: 'Recommended Apps',
        totalApps: 1,
      },
      {
        apps: [
          { ...installedAndRecommendedApp },
        ],
        category: 'storage',
        title: 'storage',
        totalApps: 1,
      },
      {
        apps: [
          { ...plexApp },
        ],
        category: 'media',
        title: 'media',
        totalApps: 1,
      },
    ]);
  });
});
