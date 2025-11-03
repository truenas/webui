import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ContainerStatus } from 'app/enums/container.enum';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import { InstanceIdmapComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-idmap/instance-idmap.component';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('InstanceIdmapComponent', () => {
  let spectator: Spectator<InstanceIdmapComponent>;

  const createComponent = createComponentFactory({
    component: InstanceIdmapComponent,
    imports: [CardExpandCollapseComponent],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: fakeVirtualizationInstance({
          id: 1,
          status: {
            state: ContainerStatus.Running,
            pid: 123,
            domain_state: null,
          },
        }),
      },
    });
  });

  it('shows TODO message when instance is running', () => {
    expect(spectator.query('mat-card-content')!.textContent!.trim()).toBe('TODO: Show idmap information here if available via API.');
  });

  it('shows message when instance is not running', () => {
    spectator.setInput('instance', fakeVirtualizationInstance({
      id: 1,
      status: {
        state: ContainerStatus.Stopped,
        pid: null,
        domain_state: null,
      },
    }));

    expect(spectator.query('mat-card-content')!.textContent!.trim()).toBe('Container is not running');
  });
});
