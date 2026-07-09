import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnIconHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfHost, NvmeOfSubsystem, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { ManageHostsDialog } from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';

describe('ManageHostsDialog', () => {
  let spectator: Spectator<ManageHostsDialog>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const hosts = [
    {
      id: 1,
      hostnqn: 'nqn.2014-08.org.nvmexpress',
      description: '',
      dhchap_key: '1234567890',
    },
    {
      id: 2,
      hostnqn: 'nqn.2014-09.org.nvmexpress',
      description: '',
    },
  ] as NvmeOfHost[];
  const createComponent = createComponentFactory({
    component: ManageHostsDialog,
    providers: [
      mockApi([
        mockCall('nvmet.host.delete'),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of({ confirmed: true, force: true }),
        })),
      }),
      mockProvider(NvmeOfStore, {
        state$: of({
          hosts,
          subsystems: [
            {
              id: 1,
              hosts: [1],
            },
            {
              id: 1,
              hosts: [1],
            },
            {
              id: 1,
              hosts: [2],
            },
          ] as NvmeOfSubsystem[],
        }),
        reloadHosts: jest.fn(),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success({})),
      }),
      mockProvider(DialogRef, {
        close: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows a list of hosts', async () => {
    expect(await table.getHeaderTexts()).toEqual(['NQN', 'Description', 'Has Host Authentication', 'Used In Subsystems', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['nqn.2014-08.org.nvmexpress', '', 'Yes', '2', ''],
      ['nqn.2014-09.org.nvmexpress', '', 'No', '1', ''],
    ]);
  });

  it('opens host form when Edit button is pressed', async () => {
    const editButton = (await loader.getAllHarnesses(TnIconHarness.with({ name: 'mdi-pencil' })))[0];
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      HostFormComponent,
      { title: 'Edit Host', inputs: { host: expect.objectContaining(hosts[0]) } },
    );
    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });

  it('deletes the port with correct force flag based on subsystem usage', async () => {
    const deleteButton = (await loader.getAllHarnesses(TnIconHarness.with({ name: 'mdi-delete' })))[0];
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SubsystemPortOrHostDeleteDialogComponent, {
      data: {
        type: PortOrHostDeleteType.Host,
        item: {
          ...hosts[0],
          usedInSubsystems: 2,
        },
        name: 'nqn.2014-08.org.nvmexpress',
        subsystemsInUse: [],
      },
      minWidth: '500px',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.host.delete', [1, { force: true }]);

    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });

  it('opens a form to add a new host when Add New is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add New' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(HostFormComponent, { title: 'Add Host' });
    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });
});
