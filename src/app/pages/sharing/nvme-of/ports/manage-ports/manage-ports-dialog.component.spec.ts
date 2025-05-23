import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { NvmeOfPort, NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { ManagePortsDialog } from 'app/pages/sharing/nvme-of/ports/manage-ports/manage-ports-dialog.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/ports/port-form/port-form.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';

describe('ManagePortsDialog', () => {
  let spectator: Spectator<ManagePortsDialog>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
  const createComponent = createComponentFactory({
    component: ManagePortsDialog,
    providers: [
      mockApi([
        mockCall('nvmet.port.delete'),
      ]),
      mockProvider(NvmeOfStore, {
        state$: of({
          ports,
          subsystems: [
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
          ] as NvmeOfSubsystem[],
        }),
        reloadPorts: jest.fn(),
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

  it('shows a list of ports', async () => {
    expect(await table.getCellTexts()).toEqual([
      ['Type', 'Address', 'Port', 'Used In Subsystems', ''],
      ['TCP', '10.120.120.120', '7000', '2', ''],
      ['RDMA', '10.100.100.100', '9000', '1', ''],
    ]);
  });

  it('opens port form when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'TCP');
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      PortFormComponent,
      { data: expect.objectContaining(ports[0]) },
    );
    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });

  it('deletes the port when Delete button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'TCP');
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.port.delete', [ports[0].id]);
    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });

  it('opens a form to add a new port when Add New is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add New' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortFormComponent);
    expect(spectator.inject(NvmeOfStore).reloadPorts).toHaveBeenCalled();
  });
});
