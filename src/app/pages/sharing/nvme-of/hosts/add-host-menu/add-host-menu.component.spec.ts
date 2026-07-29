import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { ManageHostsDialog } from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

describe('AddHostMenuComponent', () => {
  let spectator: Spectator<AddHostMenuComponent>;
  let loader: HarnessLoader;

  const usedHost = {
    id: 1,
    hostnqn: 'iqn.2023-10.com.example:host1',
  } as NvmeOfHost;
  const newHost = {
    id: 2,
    hostnqn: 'iqn.2023-11.com.example:host1',
  } as NvmeOfHost;
  const unusedHost = {
    id: 3,
    hostnqn: 'iqn.2023-12.com.example:host1',
  } as NvmeOfHost;

  const allHosts = signal<NvmeOfHost[]>([]);
  const createComponent = createComponentFactory({
    component: AddHostMenuComponent,
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(NvmeOfStore, {
        hosts: allHosts,
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(newHost)),
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
        hosts: [],
        showAllowAnyHost: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.component.hostSelected, 'emit');
  });

  async function openMenu(): Promise<TnMenuHarness> {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  it('opens the host form when the single Add button is pressed and emits (hostSelected) with the new host', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(HostFormComponent, { title: 'Add Host' });
    expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(newHost);
  });

  it('shows menu with Allow all hosts option when no hosts exist but showAllowAnyHost is true', async () => {
    jest.spyOn(spectator.component.allowAllHostsSelected, 'emit');
    spectator.setInput('showAllowAnyHost', true);

    const menu = await openMenu();

    await menu.clickItem({ label: 'Allow all hosts' });

    expect(spectator.component.allowAllHostsSelected.emit).toHaveBeenCalled();
  });

  describe('some hosts exist in the system', () => {
    beforeEach(() => {
      allHosts.set([usedHost, unusedHost]);
      spectator.setInput('hosts', [usedHost]);
    });

    it('lists available hosts that are not used in current subsystem', async () => {
      const menu = await openMenu();

      const labels = await menu.getItemLabels();
      expect(labels).toHaveLength(3);
      expect(labels[0]).toContain('iqn.2023-12.com.example:host1');
    });

    it('emits (hostSelected) when a host is selected', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: /iqn\.2023-12\.com\.example:host1/ });

      expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(unusedHost);
    });

    it('emits (allowAllHostsSelected) when allowAllHosts() is called', async () => {
      jest.spyOn(spectator.component.allowAllHostsSelected, 'emit');
      spectator.setInput('showAllowAnyHost', true);

      const menu = await openMenu();

      await menu.clickItem({ label: 'Allow all hosts' });

      expect(spectator.component.allowAllHostsSelected.emit).toHaveBeenCalled();
    });

    it('opens the host form from the Create New menu item and emits (hostSelected) with the new host', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: 'Create New' });

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(HostFormComponent, { title: 'Add Host' });
      expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(newHost);
    });

    it('has Manage Hosts button that opens Manage hosts dialog', async () => {
      const menu = await openMenu();

      await menu.clickItem({ label: 'Manage Hosts' });

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(ManageHostsDialog, { minWidth: '450px', maxWidth: '768px' });
    });
  });
});
