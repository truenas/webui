import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  NvmeOfHost,
  NvmeOfNamespace, NvmeOfPort,
  NvmeOfSubsystemDetails,
} from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemsListComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystems-list.component';

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
    hosts: [{ id: 1 }, { id: 2 }, { id: 3 }] as NvmeOfHost[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as NvmeOfPort[],
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
    hosts: [{ id: 1 }, { id: 2 }, { id: 3 }] as NvmeOfHost[],
    ports: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }] as NvmeOfPort[],
    namespaces: [{ id: 1 }, { id: 2 }] as NvmeOfNamespace[],
  },
];

describe('SubsystemsListComponent', () => {
  let spectator: Spectator<SubsystemsListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: SubsystemsListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockProvider(EmptyService),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    const mockSubsystemsDataProvicer = new ArrayDataProvider<NvmeOfSubsystemDetails>();
    mockSubsystemsDataProvicer.setRows(mockSubsystems);
    spectator = createComponent({
      props: {
        dataProvider: mockSubsystemsDataProvicer,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Namespaces', 'Ports', 'Hosts', '']);
    expect(await table.getRowTexts(0)).toEqual(['subsys-1', '2', '4', '3', '']);
    expect(await table.getRowTexts(1)).toEqual(['subsys-2', '2', '4', '3', '']);
  });
});
