import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(newPort)),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(undefined),
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

  async function openMenu(): Promise<TnMenuHarness> {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('opens the port form when the single Add button is pressed and emits (portSelected) with the new port', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(PortFormComponent, { title: 'Add Port' });
    expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(newPort);
  });

  describe('some ports exist in the system', () => {
    beforeEach(() => {
      allPorts.set([usedPort, unusedPort]);
      spectator.setInput('subsystemPorts', [usedPort]);
    });

    it('lists available ports that are not used in current subsystem', async () => {
      const menu = await openMenu();

      const labels = await menu.getItemLabels();
      expect(labels).toHaveLength(3);
      expect(labels[0]).toContain('10.100.100.100:9000');
    });

    it('emits (portSelected) when a port is selected', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: /10\.100\.100\.100:9000/ });

      expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(unusedPort);
    });

    it('opens the port form from the Create New menu item and emits (portSelected) with the new port', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: 'Create New' });

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(PortFormComponent, { title: 'Add Port' });
      expect(spectator.component.portSelected.emit).toHaveBeenCalledWith(newPort);
    });

    it('has Manage Ports button that opens Manage ports dialog', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: 'Manage Ports' });

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ManagePortsDialog, { minWidth: '450px', maxWidth: '768px' });
    });
  });
});
