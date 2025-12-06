import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: newHost })),
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
        hosts: [],
        showAllowAnyHost: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.component.hostSelected, 'emit');
  });

  it('shows single Add button when there are no hosts in the system at all', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(HostFormComponent);
    expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(newHost);
  });

  describe('some hosts exist in the system', () => {
    beforeEach(() => {
      allHosts.set([usedHost, unusedHost]);
      spectator.setInput('hosts', [usedHost]);
    });

    it('lists available hosts that are not used in current subsystem', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(items).toHaveLength(3);
      expect(await items[0].getText()).toBe('iqn.2023-12.com.example:host1');
    });

    it('emits (hostSelected) when a host is selected', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      await menu.clickItem({ text: 'iqn.2023-12.com.example:host1' });

      expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(unusedHost);
    });

    it('emits (allowAllHostsSelected) when allowAllHosts() is called', async () => {
      jest.spyOn(spectator.component.allowAllHostsSelected, 'emit');
      spectator.setInput('showAllowAnyHost', true);

      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      await menu.clickItem({ text: 'Allow all hosts' });

      expect(spectator.component.allowAllHostsSelected.emit).toHaveBeenCalled();
    });

    it('has create new button that opens host form and emits (hostSelected) with new host', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(await items[1].getText()).toBe('Create New');

      await items[1].click();

      expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(HostFormComponent);
      expect(spectator.component.hostSelected.emit).toHaveBeenCalledWith(newHost);
    });

    it('has Manage Hosts button that opens Manage hosts dialog', async () => {
      const menu = await loader.getHarness(MatMenuHarness.with({ triggerText: 'Add' }));
      await menu.open();

      const items = await menu.getItems();
      expect(await items[2].getText()).toBe('Manage Hosts');

      await items[2].click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ManageHostsDialog, { minWidth: '450px' });
    });
  });
});
