import { UsedPort } from 'app/interfaces/chart-release.interface';
import { getPorts } from 'app/pages/apps/utils/get-ports';

describe('getPorts', () => {
  const ports = [
    {
      port: 22,
      protocol: 'TCP',
    },
    {
      port: 80,
      protocol: 'TCP',
    },
    {
      port: 443,
      protocol: 'TCP',
    },
    {
      port: 65535,
      protocol: 'UDP',
    },
  ] as UsedPort[];

  it('returns a formatted string of used ports', () => {
    const result = getPorts(ports);

    expect(result).toBe('22\\TCP, 80\\TCP, 443\\TCP, 65535\\UDP');
  });
});
