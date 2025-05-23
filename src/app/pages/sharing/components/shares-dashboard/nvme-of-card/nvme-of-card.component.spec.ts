import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NvmeOfHost, NvmeOfNamespace, NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfCardComponent } from 'app/pages/sharing/components/shares-dashboard/nvme-of-card/nvme-of-card.component';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { NvmeOfConfigurationComponent } from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemDeleteDialogComponent } from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystem-delete-dialog/subsystem-delete-dialog.component';
import { selectServices } from 'app/store/services/services.selectors';

describe('NvmeOfCardComponent', () => {
  let spectator: Spectator<NvmeOfCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const mockSubsystems = [
    {
      id: 1,
      name: 'subsys-1',
      hosts: [{ id: 1 }, { id: 2 }, { id: 3 }] as NvmeOfHost[],
      ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as NvmeOfPort[],
      namespaces: [{ id: 1 }, { id: 2 }] as NvmeOfNamespace[],
    },
  ];

  const mockNvmeOfStore = {
    isLoading: () => false,
    subsystems: () => mockSubsystems,
    initialize: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: NvmeOfCardComponent,
    declarations: [
      MockComponents(
        ServiceStateButtonComponent,
        ServiceExtraActionsComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      mockProvider(NvmeOfStore, mockNvmeOfStore),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of({ confirmed: true, force: true }),
        })),
      }),
      mockApi([
        mockCall('nvmet.subsys.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.NvmeOf,
              state: ServiceStatus.Stopped,
              enable: false,
            } as Service],
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should initialize store on init', () => {
    expect(mockNvmeOfStore.initialize).toHaveBeenCalled();
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Namespaces', 'Ports', 'Hosts', ''],
      ['subsys-1', '2', '4', '3', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  // Unskip below tests once the functionality is implemented (edit + delete)
  it.skip('shows form to edit an existing NVME-oF Share when Edit button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NvmeOfConfigurationComponent);
  });

  // Unskip below tests once the functionality is implemented (edit + delete)
  it.skip('shows confirmation to delete NVME-oF Share when Delete button is pressed', async () => {
    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Delete' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SubsystemDeleteDialogComponent, expect.anything());
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.subsys.delete', [1, { force: true }]);
  });

  // remove once the above tests are unskipped
  it('[temp] shows confirmation to delete NVME-oF Share when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SubsystemDeleteDialogComponent, expect.anything());
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.subsys.delete', [1, { force: true }]);
  });
});
