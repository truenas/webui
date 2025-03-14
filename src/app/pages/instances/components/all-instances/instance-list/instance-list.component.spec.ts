import { ActivatedRoute, Router } from '@angular/router';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { InstanceListComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-list.component';
import { InstanceRowComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-row.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

describe('InstanceListComponent', () => {
  let spectator: Spectator<InstanceListComponent>;
  let router: Router;

  const mockInstance = {
    id: '1',
    name: 'agi_instance',
    status: VirtualizationStatus.Running,
    type: VirtualizationType.Container,
  } as VirtualizationInstance;

  const mockInstance2 = { ...mockInstance, id: '2' };
  const params$ = new BehaviorSubject({});

  const createComponent = createRoutingFactory({
    component: InstanceListComponent,
    imports: [InstanceRowComponent],
    providers: [
      mockAuth(),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
        instances: jest.fn(() => [mockInstance, mockInstance2]),
        isLoading: jest.fn(() => false),
      }),
      mockProvider(VirtualizationDevicesStore, {
        selectInstance: jest.fn(),
        selectInstanceById: jest.fn(),
        selectedInstance: jest.fn(() => null),
      }),
      {
        provide: ActivatedRoute,
        useValue: params$,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  it('shows a list of instances', () => {
    const instances = spectator.queryAll(InstanceRowComponent);

    params$.next({});

    expect(instances).toHaveLength(2);
    expect(instances[0].instance()).toEqual(mockInstance);
    expect(router.navigate).toHaveBeenCalledWith(['/instances', 'view', mockInstance.id]);
  });

  it('redirects to the first instance when passed invalid id', () => {
    params$.next({});

    expect(router.navigate).toHaveBeenCalledWith(['/instances', 'view', '1']);
  });
});
