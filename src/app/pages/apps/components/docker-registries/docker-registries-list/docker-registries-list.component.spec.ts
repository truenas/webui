import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { dockerHubRegistry, DockerRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerRegistriesListComponent } from 'app/pages/apps/components/docker-registries/docker-registries-list/docker-registries-list.component';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('DockerRegistriesListComponent', () => {
  let spectator: Spectator<DockerRegistriesListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const dockerRegistries: DockerRegistry[] = [
    {
      id: 1,
      name: 'Docker Hub',
      description: 'Docker Hub',
      uri: dockerHubRegistry,
      username: 'docker',
      password: 'password',
    },
  ];

  const createComponent = createComponentFactory({
    component: DockerRegistriesListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('app.registry.query', dockerRegistries),
        mockCall('app.registry.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('queries the registries and shows them as table rows', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.registry.query');

    expect(await table.getRowCount()).toBe(1);
    expect(await table.getHeaderTexts()).toEqual(expect.arrayContaining(['Name', 'Username', 'URI']));
    expect(await table.getCellText(0, 'name')).toBe('Docker Hub');
    expect(await table.getCellText(0, 'username')).toBe('docker');
    expect(await table.getCellText(0, 'uri')).toBe(dockerHubRegistry);
  });

  it('opens delete dialog when the row "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Docker Registry',
      message: 'Are you sure you want to delete the <b>Docker Hub (https://index.docker.io/v1/)</b> registry?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.registry.delete', [1]);
  });

  it('opens form when the row "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'pencil' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DockerRegistryFormComponent, {
      data: {
        registry: dockerRegistries[0],
        isLoggedInToDockerHub: true,
      },
    });
  });

  it('opens form when "Add Registry" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add Registry' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DockerRegistryFormComponent, {
      data: {
        isLoggedInToDockerHub: true,
      },
    });
  });
});
