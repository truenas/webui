import { ContainerStatus } from 'app/enums/container.enum';
import { Container } from 'app/interfaces/container.interface';

export function fakeContainer(overrides: Partial<Container> = {}): Container {
  return {
    id: 1,
    uuid: 'test-uuid',
    name: 'test-container',
    description: '',
    cpuset: null,
    autostart: false,
    time: 'local',
    shutdown_timeout: 30,
    dataset: 'pool/dataset',
    init: '/sbin/init',
    initdir: null,
    initenv: {},
    inituser: null,
    initgroup: null,
    idmap: { type: 'none' },
    capabilities_policy: 'DEFAULT',
    capabilities_state: {},
    status: {
      state: ContainerStatus.Stopped,
      pid: null,
      domain_state: null,
    },
    ...overrides,
  } as Container;
}
