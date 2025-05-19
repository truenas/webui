import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockDirective } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import {
  NvmeOfNamespace, NvmeOfSubsystemDetails, SubsystemHostAssociation, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableDetailsRowComponent } from 'app/modules/ix-table/components/ix-table-details-row/ix-table-details-row.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfSubsystemsComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/nvme-of-subsystems.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

const mockSubsystems: NvmeOfSubsystemDetails[] = [
  {
    allow_any_host: true,
    id: 1,
    name: 'subsys-1',
    ieee_oui: 'ieee_oui-1',
    ana: false,
    pi_enable: true,
    qix_max: 4,
    serial: 'serial-1',
    subnqn: 'subnqn-1',
    hosts: [{ id: 1 }, { id: 2 }] as SubsystemHostAssociation[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as SubsystemPortAssociation[],
    namespaces: [{ id: 1 }, { id: 2 }, { id: 3 }] as NvmeOfNamespace[],
  },
  {
    allow_any_host: true,
    id: 2,
    name: 'subsys-2',
    ieee_oui: 'ieee_oui-2',
    ana: false,
    pi_enable: true,
    qix_max: 4,
    serial: 'serial-2',
    subnqn: 'subnqn-2',
    hosts: [{ id: 1 }, { id: 2 }] as SubsystemHostAssociation[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as SubsystemPortAssociation[],
    namespaces: [{ id: 1 }, { id: 2 }, { id: 3 }] as NvmeOfNamespace[],
  },
];

describe('NvmeOfSubsystems', () => {
  let spectator: Spectator<NvmeOfSubsystemsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NvmeOfSubsystemsComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      MockDirective(DetailsHeightDirective),
      IxTableComponent,
      IxTableDetailsRowComponent,
    ],
    providers: [
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
        subsystems: signal(mockSubsystems),
        isLoading: signal(false),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: { ...mockSubsystems[0], name: 'subsys-3' } })),
      }),
      mockApi([
        mockCall('nvmet.subsys.delete'),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => {
          return {
            afterClosed: jest.fn(() => of({ confirmed: true, force: true })),
          };
        }),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              consolemsg: false,
            },
          },
        ],
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const expectedRows = [
      ['Name', 'Namespaces', 'Hosts', 'Ports', ''],
      ['subsys-1', '3', '2', '4', ''],
      ['subsys-2', '3', '2', '4', ''],
    ];

    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('deletes subsystem', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.subsys.delete', [1, { force: true }]);
  });
});
