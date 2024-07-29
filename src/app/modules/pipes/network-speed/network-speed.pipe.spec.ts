import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';

describe('NetworkSpeedPipe', () => {
  let spectator: SpectatorPipe<NetworkSpeedPipe>;
  const createPipe = createPipeFactory(NetworkSpeedPipe);

  it('converts values to bits per second', () => {
    spectator = createPipe('{{ 1000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('1 kb/s');
  });
});
