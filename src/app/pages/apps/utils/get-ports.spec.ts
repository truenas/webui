import { AppUsedPort } from 'app/interfaces/chart-release.interface';
import { getPorts } from 'app/pages/apps/utils/get-ports';

describe('getPorts', () => {
  const ports = [
    {
      container_port: '22',
      protocol: 'TCP',
    },
    {
      container_port: '80',
      protocol: 'TCP',
    },
    {
      container_port: '443',
      protocol: 'TCP',
    },
    {
      container_port: '65535',
      protocol: 'UDP',
    },
  ] as AppUsedPort[];

  it('returns a formatted string of used ports', () => {
    const result = getPorts(ports);

    expect(result).toBe('22\\TCP, 80\\TCP, 443\\TCP, 65535\\UDP');
  });
});
