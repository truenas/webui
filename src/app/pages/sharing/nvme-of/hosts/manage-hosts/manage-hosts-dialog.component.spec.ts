import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfHost, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/hosts/host-form/host-form.component';
import { ManageHostsDialog } from 'app/pages/sharing/nvme-of/hosts/manage-hosts/manage-hosts-dialog.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

describe('ManageHostsDialog', () => {
  let spectator: Spectator<ManageHostsDialog>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const hosts = [
    {
      id: 1,
      hostnqn: 'nqn.2014-08.org.nvmexpress',
      dhchap_key: '1234567890',
    },
    {
      id: 2,
      hostnqn: 'nqn.2014-09.org.nvmexpress',
    },
  ] as NvmeOfHost[];
  const createComponent = createComponentFactory({
    component: ManageHostsDialog,
    providers: [
      mockApi([
        mockCall('nvmet.host.delete'),
      ]),
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: {} })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows a list of hosts', async () => {
    expect(await table.getCellTexts()).toEqual([
      ['NQN', 'Has Host Authentication', 'Used In Subsystems', ''],
      ['nqn.2014-08.org.nvmexpress', 'Yes', '2', ''],
      ['nqn.2014-09.org.nvmexpress', 'No', '1', ''],
    ]);
  });

  it('opens host form when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'nqn.2014-08.org.nvmexpress');
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      HostFormComponent,
      { data: expect.objectContaining(hosts[0]) },
    );
    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });

  it('deletes the host when Delete button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'nqn.2014-08.org.nvmexpress');
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.host.delete', [hosts[0].id]);
    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });

  it('opens a form to add a new host when Add New is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add New' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(HostFormComponent);
    expect(spectator.inject(NvmeOfStore).reloadHosts).toHaveBeenCalled();
  });
});
