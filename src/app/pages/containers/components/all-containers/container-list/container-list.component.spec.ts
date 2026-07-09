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

  beforeEach(() => {
    spectator = createComponent();
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

  it('sorts ascending when clicking a header that is not the active sort column', () => {
    spectator.click(spectator.query('[data-test="text-sort-status"]')!);

    expect(spectator.inject(ContainersStore).setSort).toHaveBeenCalledWith({
      active: ContainerSortField.Status,
      direction: SortDirection.Asc,
    });
  });

  it('toggles direction to descending when clicking the active ascending sort column', () => {
    spectator.click(spectator.query('[data-test="text-sort-name"]')!);

    expect(spectator.inject(ContainersStore).setSort).toHaveBeenCalledWith({
      active: ContainerSortField.Name,
      direction: SortDirection.Desc,
    });
  });
});
