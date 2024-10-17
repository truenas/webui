import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute } from '@angular/router';
import { SpectatorRouting } from '@ngneat/spectator';
import { createRoutingFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import {
  CustomAppButtonComponent,
} from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { CategoryViewComponent } from './category-view.component';

describe('CategoryViewComponent', () => {
  let spectator: SpectatorRouting<CategoryViewComponent>;
  let loader: HarnessLoader;
  let store$: AppsFilterStore;

  const createComponent = createRoutingFactory({
    component: CategoryViewComponent,
    imports: [
      MockComponent(PageHeaderComponent),
    ],
    declarations: [
      MockComponent(AppCardComponent),
      MockComponent(CustomAppButtonComponent),
    ],
    providers: [
      mockProvider(ActivatedRoute, {
        snapshot: { params: { category: 'new-and-updated' } },
      }),
      mockProvider(AppsFilterStore, {
        filterValues$: of({
          sort: null,
          categories: [],
        }),
        isFilterApplied$: of(false),
        searchQuery$: of(''),
        applySearchQuery: jest.fn(),
        applyFilters: jest.fn(),
        resetFilters: jest.fn(),
      }),
      mockProvider(DockerStore, {
        selectedPool$: of('pool'),
      }),
      mockProvider(AppsStore, {
        appsCategories$: of(['storage', 'crypto', 'media', 'torrent', 'new-and-updated']),
        availableApps$: of([{
          categories: ['storage', 'crypto', 'new-and-updated'],
          last_update: { $date: 452 },
          name: 'chia',
        }, {
          categories: ['media', 'torrent', 'new-and-updated'],
          last_update: { $date: 343 },
          name: 'qbittorent',
        }] as AvailableApp[]),
      }),
    ],
    params: {
      category: 'new-and-updated',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(AppsFilterStore);
    spectator.fixture.detectChanges();
  });

  it('should apply filters to the store', () => {
    jest.spyOn(store$, 'applyFilters').mockImplementation();

    expect(store$.applyFilters).toHaveBeenCalledWith({
      categories: ['new-and-updated'],
      sort: null,
    });
  });

  it('should redirect to Discover page', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Back to Discover Page' }));
    await button.click();

    jest.spyOn(store$, 'resetFilters').mockImplementation();
    expect(store$.resetFilters).toHaveBeenCalled();
  });
});
