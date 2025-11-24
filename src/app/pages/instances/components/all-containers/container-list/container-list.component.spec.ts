import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerStatus } from 'app/enums/container.enum';
import { LayoutService } from 'app/modules/layout/layout.service';
import { ContainerListComponent } from 'app/pages/instances/components/all-containers/container-list/container-list.component';
import { ContainerRowComponent } from 'app/pages/instances/components/all-containers/container-list/container-row/container-row.component';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';
import { fakeContainerInstance } from 'app/pages/instances/utils/fake-container-instance.utils';

describe('ContainerListComponent', () => {
  let spectator: Spectator<ContainerListComponent>;

  const mockInstance = fakeContainerInstance({
    id: 1,
    name: 'agi_instance',
    status: {
      state: ContainerStatus.Running,
      pid: 123,
      domain_state: null,
    },
  });

  const createComponent = createRoutingFactory({
    component: ContainerListComponent,
    imports: [ContainerRowComponent],
    providers: [
      mockAuth(),
      mockProvider(ContainerInstancesStore, {
        initialize: jest.fn(),
        instances: jest.fn(() => [mockInstance]),
        metrics: jest.fn(() => ({})),
        isLoading: jest.fn(() => false),
        selectedInstance: jest.fn(() => mockInstance),
        selectInstance: jest.fn(),
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

  it('shows a list of instances', () => {
    const instances = spectator.queryAll(ContainerRowComponent);

    expect(instances).toHaveLength(1);
    expect(instances[0].instance()).toEqual(mockInstance);
  });

  it('shows details', () => {
    const router = spectator.inject(Router);
    spectator.click(spectator.query('ix-container-row')!);
    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/containers', 'view', 1,
    ]);
  });
});
