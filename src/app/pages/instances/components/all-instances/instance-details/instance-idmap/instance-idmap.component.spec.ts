import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import { InstanceIdmapComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-idmap/instance-idmap.component';

describe('InstanceIdmapComponent', () => {
  let spectator: Spectator<InstanceIdmapComponent>;

  const createComponent = createComponentFactory({
    component: InstanceIdmapComponent,
    imports: [CardExpandCollapseComponent],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: {
          id: 'my-instance',
          status: VirtualizationStatus.Running,
          type: VirtualizationType.Container,
          userns_idmap: {
            uid: { hostid: 11, maprange: 12, nsid: 13 },
            gid: { hostid: 21, maprange: 22, nsid: 23 },
          },
        } as VirtualizationInstance,
      },
    });
  });

  function getDetails(block: 0 | 1): Record<string, string> {
    return Array.from(spectator.queryAll('.details-list')[block].querySelectorAll('.details-item')).reduce((acc, item: HTMLElement) => {
      const key = item.querySelector('.label')!.textContent!;
      const value = item.querySelector('.value')!.textContent!;
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  it('shows userns idmap uid', () => {
    expect(getDetails(0)).toEqual({ 'Host ID:': '11', 'Maprange:': '12', 'NS ID:': '13' });
  });

  it('shows userns idmap gid', () => {
    expect(getDetails(1)).toEqual({ 'Host ID:': '21', 'Maprange:': '22', 'NS ID:': '23' });
  });

  it('shows message when instance is not running', () => {
    spectator.setInput('instance', {
      id: 'my-instance',
      status: VirtualizationStatus.Stopped,
      type: VirtualizationType.Container,
    } as VirtualizationInstance);

    expect(spectator.query('mat-card-content').textContent.trim()).toBe('Instance is not running');
  });
});
