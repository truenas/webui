import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockTypedApi, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { IscsiConnectionsCardComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/iscsi-connections-card/iscsi-connections-card.component';

describe('IscsiConnectionsCardComponent', () => {
  let spectator: Spectator<IscsiConnectionsCardComponent>;

  const createComponent = createComponentFactory({
    component: IscsiConnectionsCardComponent,
    providers: [
      mockTypedApi([
        mockTypedQuery('iscsi.global.sessions', [
          { initiator: 'iqn.1991-05.com.microsoft:initiator1', initiator_addr: '192.168.1.100' },
          { initiator: 'iqn.1991-05.com.microsoft:initiator2', initiator_addr: '192.168.1.101' },
        ] as WebUiQueryEntity<'iscsi.global.sessions'>[]),
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
