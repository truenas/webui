import { ContainerGlobalConfig } from 'app/interfaces/container.interface';
import { getDefaultNicBridge } from 'app/pages/containers/utils/default-nic-bridge.utils';

describe('getDefaultNicBridge', () => {
  it('returns the configured bridge', () => {
    expect(getDefaultNicBridge({ bridge: 'br0' } as ContainerGlobalConfig)).toBe('br0');
  });

  it('returns truenasbr0 when the bridge is Automatic or the config is not loaded', () => {
    expect(getDefaultNicBridge({ bridge: null } as ContainerGlobalConfig)).toBe('truenasbr0');
    expect(getDefaultNicBridge({ bridge: '' } as unknown as ContainerGlobalConfig)).toBe('truenasbr0');
    expect(getDefaultNicBridge(null)).toBe('truenasbr0');
  });
});
