import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { LayoutService } from 'app/modules/layout/layout.service';
import { ContainerListComponent } from 'app/pages/containers/components/all-containers/container-list/container-list.component';
import { ContainerRowComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-row.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
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
});
