import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { SpectatorHost, createHostFactory } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import {
  NvmeOfHost, NvmeOfNamespace, NvmeOfPort, NvmeOfSubsystemDetails,
} from 'app/interfaces/nvme-of.interface';
import { SubSystemNameCellComponent } from './subsystem-name-cell.component';

describe('SubSystemNameCellComponent', () => {
  let spectator: SpectatorHost<SubSystemNameCellComponent>;
  let loader: HarnessLoader;

  const createHost = createHostFactory({
    component: SubSystemNameCellComponent,
    shallow: true,
  });

  function setup(subsystem: NvmeOfSubsystemDetails): void {
    spectator = createHost('<ix-subsystem-name-cell [subsystem]="subsystem" />', {
      hostProps: { subsystem },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
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

  it('does not show warning icon when subsystem is properly configured', async () => {
    setup({
      name: 'subsys-ok',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: true,
    } as NvmeOfSubsystemDetails);

    const icon = await loader.getHarnessOrNull(TnIconHarness.with({ name: 'alert' }));
    expect(icon).toBeNull();
  });

  it('shows warning icon if there are no namespaces', async () => {
    setup({
      name: 'missing-ns',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [],
      hosts: [{ id: 1 }] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    const icon = await loader.getHarnessOrNull(TnIconHarness.with({ name: 'alert' }));
    expect(icon).not.toBeNull();
  });

  it('shows warning icon if there are no ports', async () => {
    setup({
      name: 'missing-ports',
      ports: [],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [{ id: 1 }] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    const icon = await loader.getHarnessOrNull(TnIconHarness.with({ name: 'alert' }));
    expect(icon).not.toBeNull();
  });

  it('shows warning icon if there are no hosts and allow_any_host is false', async () => {
    setup({
      name: 'no-hosts',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: false,
    } as NvmeOfSubsystemDetails);

    const icon = await loader.getHarnessOrNull(TnIconHarness.with({ name: 'alert' }));
    expect(icon).not.toBeNull();
  });

  it('does not show warning if no hosts but allow_any_host is true', async () => {
    setup({
      name: 'no-hosts-allowed',
      ports: [{ id: 1 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }] as NvmeOfNamespace[],
      hosts: [] as NvmeOfHost[],
      allow_any_host: true,
    } as NvmeOfSubsystemDetails);

    const icon = await loader.getHarnessOrNull(TnIconHarness.with({ name: 'alert' }));
    expect(icon).toBeNull();
  });
});
