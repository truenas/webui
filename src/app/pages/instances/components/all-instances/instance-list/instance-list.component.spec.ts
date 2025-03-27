import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
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
});
