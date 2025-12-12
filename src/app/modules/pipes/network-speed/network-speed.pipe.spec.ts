import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';

describe('NetworkSpeedPipe', () => {
  let spectator: SpectatorPipe<NetworkSpeedPipe>;
  const createPipe = createPipeFactory(NetworkSpeedPipe);

  it('converts values to bytes per second', () => {
    spectator = createPipe('{{ 1000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('1000 B/s');
  });

  it('converts large values correctly', () => {
    spectator = createPipe('{{ 100000000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('95.37 MiB/s');
  });

  it('converts gigabyte speeds correctly', () => {
    spectator = createPipe('{{ 1000000000 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('953.67 MiB/s');
  });

  it('handles small byte values', () => {
    spectator = createPipe('{{ 500 | ixNetworkSpeed }}');

    expect(spectator.element).toHaveText('500 B/s');
  });
});
