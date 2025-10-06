import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { ContainerInstance } from 'app/interfaces/virtualization.interface';

export function fakeVirtualizationInstance(overrides: Partial<ContainerInstance> = {}): ContainerInstance {
  return {
    id: 1,
    uuid: 'test-uuid',
    name: 'test-instance',
    description: '',
    vcpus: null,
    cores: null,
    threads: null,
    cpuset: null,
    memory: null,
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
      state: VirtualizationStatus.Stopped,
      pid: null,
      domain_state: null,
    },
    ...overrides,
  } as ContainerInstance;
}
