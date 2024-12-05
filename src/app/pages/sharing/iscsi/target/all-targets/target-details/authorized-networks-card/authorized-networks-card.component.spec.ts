import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import {
  AuthorizedNetworksCardComponent,
} from 'app/pages/sharing/iscsi/target/all-targets/target-details/authorized-networks-card/authorized-networks-card.component';

describe('AuthorizedNetworksCardComponent', () => {
  let spectator: Spectator<AuthorizedNetworksCardComponent>;
  const createComponent = createComponentFactory({
    component: AuthorizedNetworksCardComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        target: {
          auth_networks: ['192.168.1.10/24', '10.0.0.1/24'],
        } as IscsiTarget,
      },
    });
  });

  it('shows a list of networks authorized for the target', () => {
    const networks = spectator.queryAll('.network');

    expect(networks).toHaveLength(2);
    expect(networks[0]).toHaveText('192.168.1.10/24');
    expect(networks[1]).toHaveText('10.0.0.1/24');
  });
});
