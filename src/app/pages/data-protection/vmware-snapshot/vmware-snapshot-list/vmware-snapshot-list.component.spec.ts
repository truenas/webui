import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { VmwareSnapshotFormComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-form/vmware-snapshot-form.component';
import { VmwareSnapshotListComponent } from 'app/pages/data-protection/vmware-snapshot/vmware-snapshot-list/vmware-snapshot-list.component';

describe('VmwareSnapshotListComponent', () => {
  let spectator: Spectator<VmwareSnapshotListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const vmwareSnapshots = [
    {
      id: 1,
      hostname: 'esxi-host-1',
      username: 'admin',
      filesystem: 'tank/vm',
      datastore: 'datastore1',
      state: { state: 'SUCCESS' },
    } as VmwareSnapshot,
  ];

  const createComponent = createComponentFactory({
    component: VmwareSnapshotListComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('vmware.query', vmwareSnapshots),
        mockCall('vmware.delete'),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Hostname', 'Username', 'Filesystem', 'Datastore', 'State']);
    expect(await table.getAllRowTexts()).toEqual([
      ['esxi-host-1', 'admin', 'tank/vm', 'datastore1', 'Success'],
    ]);
  });

  it('expands the detail row when the row itself is clicked', async () => {
    expect(await table.isRowExpanded(0)).toBe(false);

    await table.clickRow(0);

    expect(await table.isRowExpanded(0)).toBe(true);
  });

  it('opens form to create new VMware snapshot when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      VmwareSnapshotFormComponent,
      { title: 'Add VM Snapshot' },
    );
  });

  it('opens form to edit a VMware snapshot when Edit button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      VmwareSnapshotFormComponent,
      { title: 'Edit VM Snapshot', inputs: { snapshotToEdit: vmwareSnapshots[0] } },
    );
  });

  it('deletes a VMware snapshot with confirmation when Delete button is pressed', async () => {
    await table.toggleRowExpansion(0);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this snapshot?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vmware.delete', [1]);
  });
});
