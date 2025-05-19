import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  NvmeOfNamespace, NvmeOfSubsystemDetails, SubsystemHostAssociation, SubsystemPortAssociation,
} from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SubsystemsListComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystems-list/subsystems-list.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

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
    hosts: [{ id: 1 }, { id: 2 }, { id: 3 }] as SubsystemHostAssociation[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as SubsystemPortAssociation[],
    namespaces: [{ id: 1 }, { id: 2 }] as NvmeOfNamespace[],
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
    hosts: [{ id: 1 }, { id: 2 }, { id: 3 }] as SubsystemHostAssociation[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as SubsystemPortAssociation[],
    namespaces: [{ id: 1 }, { id: 2 }] as NvmeOfNamespace[],
  },
];

describe('SubsystemsListComponent', () => {
  let spectator: Spectator<SubsystemsListComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SubsystemsListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
    ],
    providers: [
      mockProvider(EmptyService),
      mockProvider(SlideIn, {
        open: jest.fn(() => {
          return of({ response: { ...mockSubsystems[0], name: 'subsys-3' } });
        }),
      }),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
        getSubsystemNamespaces: jest.fn(() => 2),
        getSubsystemHosts: jest.fn(() => 3),
        getSubsystemPorts: jest.fn(() => 4),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    const mockSubsystemsDataProvicer = new ArrayDataProvider<NvmeOfSubsystemDetails>();
    mockSubsystemsDataProvicer.setRows(mockSubsystems);
    spectator = createComponent({
      props: {
        isMobileView: false,
        dataProvider: mockSubsystemsDataProvicer,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows table rows', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const expectedRows = [
      ['Name', 'Namespaces', 'Hosts', 'Ports', ''],
      ['subsys-1', '2', '3', '4', ''],
      ['subsys-2', '2', '3', '4', ''],
    ];

    expect(await table.getCellTexts()).toEqual(expectedRows);
  });

  it('initializes store when added', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    expect(spectator.inject(NvmeOfStore).initialize).not.toHaveBeenCalled();
    await button.click();
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
  });
});
