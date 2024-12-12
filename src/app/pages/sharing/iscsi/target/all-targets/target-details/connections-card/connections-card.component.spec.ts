import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { ConnectionsCardComponent } from './connections-card.component';

describe('ConnectionsCardComponent', () => {
  let spectator: Spectator<ConnectionsCardComponent>;

  const createComponent = createComponentFactory({
    component: ConnectionsCardComponent,
    providers: [
      mockApi([
        mockCall('iscsi.global.sessions', [
          { initiator: 'iqn.1991-05.com.microsoft:initiator1', initiator_addr: '192.168.1.100' },
          { initiator: 'iqn.1991-05.com.microsoft:initiator2', initiator_addr: '192.168.1.101' },
        ] as IscsiGlobalSession[]),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        target: {
          name: 'Target1',
        } as IscsiTarget,
      },
    });
  });

  it('displays session information when available', () => {
    spectator.detectChanges();

    const connections = spectator.queryAll('.connection');
    expect(connections).toHaveLength(2);
    expect(connections[0]).toHaveText('iqn.1991-05.com.microsoft:initiator1 | 192.168.1.100');
    expect(connections[1]).toHaveText('iqn.1991-05.com.microsoft:initiator2 | 192.168.1.101');
  });
});
