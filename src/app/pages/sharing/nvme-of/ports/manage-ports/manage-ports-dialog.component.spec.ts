import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialog, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort, NvmeOfSubsystem, PortOrHostDeleteType } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemPortOrHostDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-port-ot-host-delete-dialog/subsystem-port-ot-host-delete-dialog.component';

describe('ManagePortsDialog', () => {
  let spectator: Spectator<ManagePortsDialog>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const ports = [
    {
      id: 1,
      addr_trtype: NvmeOfTransportType.Tcp,
      addr_traddr: '10.120.120.120',
      addr_trsvcid: 7000,
    },
    {
      id: 2,
      addr_trtype: NvmeOfTransportType.Rdma,
      addr_traddr: '10.100.100.100',
      addr_trsvcid: 9000,
    },
  ] as NvmeOfPort[];

  const subsystems = [
    {
      id: 1,
      ports: [1],
    },
    {
      id: 1,
      ports: [1],
    },
    {
      id: 1,
      ports: [2],
    },
  ] as NvmeOfSubsystem[];

  const createComponent = createComponentFactory({
    component: ManagePortsDialog,
    providers: [
      mockProvider(DialogRef),
      mockApi([
        mockCall('nvmet.port.delete'),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of({ confirmed: true, force: true }),
        })),
      }),
      mockProvider(NvmeOfStore, {
        state$: of({
          ports,
          subsystems,
        }),
        reloadPorts: jest.fn(),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success({})),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows a list of ports', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Type', 'Address', 'Port', 'Used In Subsystems', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['TCP', '10.120.120.120', '7000', '2', ''],
      ['RDMA', '10.100.100.100', '9000', '1', ''],
    ]);
  });

  it('opens port form when Edit button is pressed', async () => {
    // TODO: switch to a row-scoped lookup once TnTableHarness ships getHarnessInCell (library follow-up).
    const editButton = (await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' })))[0];
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      PortFormComponent,
      { title: 'Edit Port', inputs: { port: expect.objectContaining(ports[0]) } },
    );
    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });

  it('deletes the port with correct force flag based on subsystem usage', async () => {
    const deleteButton = (await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-delete' })))[0];
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(SubsystemPortOrHostDeleteDialogComponent, {
      data: {
        type: PortOrHostDeleteType.Port,
        item: {
          ...ports[0],
          usedInSubsystems: 2,
        },
        name: '10.120.120.120:7000',
        subsystemsInUse: [],
      },
      minWidth: '500px',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.delete', [1, { force: true }]);

    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });

  it('opens a form to add a new port when Add New is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add New' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(PortFormComponent, { title: 'Add Port' });
    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });
});
