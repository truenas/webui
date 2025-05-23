import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { AddSubsystemPortsComponent } from './add-subsystem-ports.component';

describe('AddSubsystemPortsComponent', () => {
  let spectator: Spectator<AddSubsystemPortsComponent>;
  let loader: HarnessLoader;

  const portsControl = new FormControl<NvmeOfPort[]>([]);

  const createComponent = createComponentFactory({
    component: AddSubsystemPortsComponent,
    imports: [
      MockComponent(AddPortMenuComponent),
      PortDescriptionComponent,
    ],
  });

  beforeEach(() => {
    portsControl.setValue([]);
    spectator = createComponent({
      props: {
        portsControl,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows empty state when no ports are added', () => {
    const prompt = spectator.query('.no-ports');
    expect(prompt).toBeVisible();
    expect(prompt.textContent).toContain(helptextNvmeOf.addPort);
  });

  it('shows a list of added ports', () => {
    const ports = [
      {
        id: 10,
        addr_trsvcid: 7000,
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.23.23.12',
      },
      {
        id: 11,
        addr_trsvcid: 6000,
        addr_trtype: NvmeOfTransportType.Rdma,
        addr_traddr: '192.168.1.5',
      },
    ] as NvmeOfPort[];

    portsControl.setValue(ports);
    spectator.detectComponentChanges();

    const portItems = spectator.queryAll('.port-list li');
    expect(portItems).toHaveLength(2);
    expect(portItems[0]).toHaveText('TCP\n—\n10.23.23.12:7000');
    expect(portItems[1]).toHaveText('RDMA\n—\n192.168.1.5:6000');
  });

  it('adds a port when port is added via the menu', () => {
    const newPort = {
      id: 10,
      addr_trsvcid: 7000,
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.23.23.12',
    } as NvmeOfPort;

    const addPortMenu = spectator.query(AddPortMenuComponent);
    addPortMenu.portSelected.emit(newPort);
    spectator.detectComponentChanges();

    expect(portsControl.value).toEqual([newPort]);

    const portItems = spectator.queryAll('.port-list li');
    expect(portItems).toHaveLength(1);
    expect(portItems[0]).toHaveText('TCP\n—\n10.23.23.12:7000');
  });

  it('removes a port when remove button is clicked', async () => {
    const ports = [
      {
        id: 10,
        addr_trsvcid: 7000,
        addr_trtype: NvmeOfTransportType.Tcp,
        addr_traddr: '10.23.23.12',
      },
      {
        id: 11,
        addr_trsvcid: 6000,
        addr_trtype: NvmeOfTransportType.Rdma,
        addr_traddr: '192.168.1.5',
      },
    ] as NvmeOfPort[];

    portsControl.setValue(ports);
    spectator.detectComponentChanges();

    const removeButton = await loader.getHarness(IxIconHarness.with({ name: 'clear' }));
    await removeButton.click();

    expect(portsControl.value).toEqual([ports[1]]);

    const portItems = spectator.queryAll('.port-list li');
    expect(portItems).toHaveLength(1);
    expect(portItems[0]).toHaveText('RDMA\n—\n192.168.1.5:6000');
  });
});
