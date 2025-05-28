import { SpectatorHost, createHostFactory } from '@ngneat/spectator/jest';
import {
  NvmeOfHost, NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystemDetails,
} from 'app/interfaces/nvme-of.interface';
import { SubSystemNameCellComponent } from './subsystem-name-cell.component';

describe('SubSystemNameCellComponent', () => {
  let spectator: SpectatorHost<SubSystemNameCellComponent>;

  const createHost = createHostFactory({
    component: SubSystemNameCellComponent,
    shallow: true,
  });

  function setup(subsystem: NvmeOfSubsystemDetails): void {
    spectator = createHost('<ix-subsystem-name-cell [subsystem]="subsystem" />', {
      hostProps: { subsystem },
    });
  }

  it('renders the subsystem name', () => {
    setup({
      name: 'subsys-1',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: true,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('span')).toHaveText('subsys-1');
  });

  it('does not show warning icon when subsystem is properly configured', () => {
    setup({
      name: 'subsys-ok',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: true,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('ix-icon')).not.toBeVisible();
  });

  it('shows warning icon if there are no namespaces', () => {
    setup({
      name: 'missing-ns',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [],
      hosts: [{ id: 1 }] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('ix-icon')).toBeVisible();
    expect(spectator.query('ix-icon')?.getAttribute('name')).toBe('warning');
  });

  it('shows warning icon if there are no ports', () => {
    setup({
      name: 'missing-ports',
      ports: [],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [{ id: 1 }] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('ix-icon')).toBeVisible();
  });

  it('shows warning icon if there are no hosts and allow_any_host is false', () => {
    setup({
      name: 'no-hosts',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('ix-icon')).toBeVisible();
  });

  it('does not show warning if no hosts but allow_any_host is true', () => {
    setup({
      name: 'no-hosts-allowed',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: true,
    } as NvmeOfSubsystemDetails);

    expect(spectator.query('ix-icon')).not.toBeVisible();
  });
});
