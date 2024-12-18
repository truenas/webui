import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputHarness } from '@angular/material/input/testing';
import {
  Spectator, mockProvider, createComponentFactory,
} from '@ngneat/spectator/jest';
import { LazyLoadImageDirective } from 'ng-lazyload-image';
import { MockComponent, MockDeclaration } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppCardComponent } from 'app/pages/apps/components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from 'app/pages/apps/components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import {
  CustomAppButtonComponent,
} from 'app/pages/apps/components/available-apps/custom-app-button/custom-app-button.component';
import { AppsFilterStore } from 'app/pages/apps/store/apps-filter-store.service';
import { AppsStatsService } from 'app/pages/apps/store/apps-stats.service';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';
import { DockerStore } from 'app/pages/apps/store/docker.store';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

const appsResponse = [{
  name: 'webdav',
  catalog: 'TRUENAS',
  train: 'community',
  description: 'webdav',
  app_readme: '<h1>WebDAV</h1>\n<p> When application ...</p>',
  last_update: { $date: 452 },
}] as AvailableApp[];

describe('Finding app', () => {
  let spectator: Spectator<AvailableAppsComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;

  const createComponent = createComponentFactory({
    component: AvailableAppsComponent,
    imports: [
      LazyLoadImageDirective,
      ReactiveFormsModule,
      MockComponent(PageHeaderComponent),
      OrNotAvailablePipe,
    ],
    declarations: [
      AvailableAppsHeaderComponent,
      AppCardComponent,
      MockDeclaration(AppCardLogoComponent),
      MockDeclaration(CustomAppButtonComponent),
    ],
    providers: [
      DockerStore,
      InstalledAppsStore,
      mockApi([]),
      mockProvider(AppsStore, {
        isLoading$: of(false),
        availableApps$: of([]),
      }),
      mockProvider(AppsFilterStore, {
        isFilterApplied$: of(false),
        filterValues$: of({}),
        applySearchQuery: jest.fn(),
        searchedApps$: of([{ apps: appsResponse }]),
        searchQuery$: of('webdav'),
      }),
      mockAuth(),
      mockProvider(AppsStatsService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    searchInput = await loader.getHarness(MatInputHarness.with({ placeholder: 'Search' }));
  });

  it('find app', async () => {
    await searchInput.setValue('webdav');
    expect(spectator.inject(AppsFilterStore).applySearchQuery).toHaveBeenLastCalledWith('webdav');

    expect(spectator.query('.section-title').textContent.trim()).toBe('Search Results for «webdav»');
  });

  it('redirect to details app when app card is pressed', () => {
    const href = spectator.query('.apps a').getAttribute('href');
    expect(href).toBe('/apps/available/community/webdav');
  });
});
