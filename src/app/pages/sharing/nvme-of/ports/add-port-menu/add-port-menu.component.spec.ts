import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

describe('AddPortMenuComponent', () => {
  let spectator: Spectator<AddPortMenuComponent>;
  let loader: HarnessLoader;

  const usedPort = {
    id: 1,
    addr_trtype: NvmeOfTransportType.Tcp,
    addr_traddr: '10.120.120.120',
    addr_trsvcid: 7000,
  } as NvmeOfPort;
  const newPort = {
    id: 2,
    addr_trtype: NvmeOfTransportType.Tcp,
    addr_traddr: '10.100.245.2',
    addr_trsvcid: 8000,
  } as NvmeOfPort;
  const unusedPort = {
    id: 2,
    addr_trtype: NvmeOfTransportType.Rdma,
    addr_traddr: '10.100.100.100',
    addr_trsvcid: 9000,
  } as NvmeOfPort;

  const allPorts = signal<NvmeOfPort[]>([]);
  const createComponent = createComponentFactory({
    component: AddPortMenuComponent,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(NvmeOfStore, {
        ports: allPorts,
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: newPort })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        subsystemPorts: [],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.component.portSelected, 'emit');
  });

  it('shows single Add button when there are no ports in the system at all', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortFormComponent);
    expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(newPort);
  });

  describe('some ports exist in the system', () => {
    beforeEach(() => {
      allPorts.set([usedPort, unusedPort]);
      spectator.setInput('subsystemPorts', [usedPort]);
    });

    it('lists available ports that are not used in current subsystem', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(items).toHaveLength(3);
      expect(await items[0].getText()).toBe('RDMA\n—\n10.100.100.100:9000');
    });

    it('emits (portSelected) when a port is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      await menu.clickItem({ text: 'RDMA\n—\n10.100.100.100:9000' });

      expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(unusedPort);
    });

    it('has create new button that opens port form and emits (portSelected) with new port', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(await items[1].getText()).toBe('Create New');

      await items[1].click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortFormComponent);
      expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(newPort);
    });

    it('has Manage Ports button that opens Manage ports dialog', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(await items[2].getText()).toBe('Manage Ports');

      await items[2].click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManagePortsDialog, { minWidth: '450px' });
    });
  });
});
