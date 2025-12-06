import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';

describe('NetworkSpeedPipe', () => {
  let spectator: SpectatorPipe<NetworkSpeedPipe>;
  const createPipe = createPipeFactory(NetworkSpeedPipe);

  it('converts values to bits per second', () => {
    spectator = createPipe('{{ 1000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('1 kb/s');
  });

  it('converts large values correctly', () => {
    spectator = createPipe('{{ 100000000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('100 Mb/s');
  });

  it('converts gigabit speeds correctly', () => {
    spectator = createPipe('{{ 1000000000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('1 Gb/s');
  });

  it('handles small bit values', () => {
    spectator = createPipe('{{ 500 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('500 b/s');
  });
});
