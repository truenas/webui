import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { dockerHubRegistry, DockerRegistry } from 'app/interfaces/docker-registry.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { DockerRegistriesListComponent } from 'app/pages/apps/components/docker-registries/docker-registries-list/docker-registries-list.component';
import { DockerRegistryFormComponent } from 'app/pages/apps/components/docker-registries/docker-registry-form/docker-registry-form.component';

describe('DockerRegistriesListComponent', () => {
  let spectator: Spectator<DockerRegistriesListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
      SearchInput1Component,
    ],
    declarations: [
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('app.registry.query', dockerRegistries),
        mockCall('app.registry.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Username', 'URI', ''],
      ['Docker Hub', 'docker', dockerHubRegistry, ''],
    ];

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.registry.query');
    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'Docker Hub');
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete the <b>Docker Hub (https://index.docker.io/v1/)</b> registry?',
      title: 'Delete Docker Registry',
      buttonColor: 'warn',
      buttonText: 'Delete',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('app.registry.delete', [1]);
  });

  it('opens form when "Add Registry" button is pressed', async () => {
    const pullImageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Registry' }));
    await pullImageButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DockerRegistryFormComponent, {
      data: {
        isLoggedInToDockerHub: true,
      },
    });
  });
});
