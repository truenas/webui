import { Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { LayoutService } from 'app/modules/layout/layout.service';
import { InstanceListComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-list.component';
import { InstanceRowComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-row.component';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('InstanceListComponent', () => {
  let spectator: Spectator<InstanceListComponent>;

  const mockInstance = {
    id: '1',
    name: 'agi_instance',
    status: VirtualizationStatus.Running,
    type: VirtualizationType.Container,
  } as VirtualizationInstance;

  const createComponent = createRoutingFactory({
    component: InstanceListComponent,
    imports: [InstanceRowComponent],
    providers: [
      mockAuth(),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
        instances: jest.fn(() => [mockInstance]),
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
    const instances = spectator.queryAll(InstanceRowComponent);

    expect(instances).toHaveLength(1);
    expect(instances[0].instance()).toEqual(mockInstance);
  });

  it('shows details', () => {
    const router = spectator.inject(Router);
    spectator.click(spectator.query('ix-instance-row')!);
    expect(spectator.inject(LayoutService).navigatePreservingScroll).toHaveBeenCalledWith(router, [
      '/instances', 'view', '1',
    ]);
  });
});
