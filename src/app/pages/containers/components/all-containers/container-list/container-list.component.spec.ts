import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSortHeaderHarness } from '@angular/material/sort/testing';
import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { LayoutService } from 'app/modules/layout/layout.service';
import { ContainerListComponent } from 'app/pages/containers/components/all-containers/container-list/container-list.component';
import { ContainerRowComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-row.component';
import { ContainerSortField, ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerListComponent', () => {
  let spectator: Spectator<ContainerListComponent>;

  const mockContainer = fakeContainer({
    id: 1,
    name: 'agi_container',
    status: {
      state: ContainerStatus.Running,
      pid: 123,
      domain_state: null,
    },
  });

  const createComponent = createRoutingFactory({
    component: ContainerListComponent,
    declarations: [MockComponent(ContainerRowComponent)],
    providers: [
      mockAuth(),
      mockProvider(ContainersStore, {
        initialize: jest.fn(),
        containers: jest.fn(() => [mockContainer]),
        metrics: jest.fn(() => ({})),
        isLoading: jest.fn(() => false),
        selectedContainer: jest.fn(() => mockContainer),
        selectContainer: jest.fn(),
        sort: jest.fn(() => ({ active: ContainerSortField.Name, direction: SortDirection.Asc })),
        setSort: jest.fn(),
      }),
      mockProvider(Router, {
        events: of(),
      }),
      mockProvider(LayoutService, {
        navigatePreservingScroll: jest.fn(() => of()),
      }),
    ],
    params: {
      id: 'invalid',
    },
  });

  let loader: HarnessLoader;

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of containers', () => {
    const containerRows = spectator.queryAll('ix-container-row');

    expect(containerRows).toHaveLength(1);
  });

  it('shows details', () => {
    const router = spectator.inject(Router);
    spectator.click(spectator.query('ix-container-row')!);
    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/containers', 'view', 1,
    ]);
  });

  it('exposes sortable Name, Status and Autostart column headers', async () => {
    const headers = await loader.getAllHarnesses(MatSortHeaderHarness);
    const labels = await Promise.all(headers.map((header) => header.getLabel()));

    expect(labels).toEqual(['Name', 'Status', 'Autostart']);
  });

  it('updates the store sort when a column header is clicked', async () => {
    const headers = await loader.getAllHarnesses(MatSortHeaderHarness);
    const statusHeader = headers[1];
    await statusHeader.click();

    expect(spectator.inject(ContainersStore).setSort).toHaveBeenCalledWith({
      active: ContainerSortField.Status,
      direction: SortDirection.Asc,
    });
  });
});
