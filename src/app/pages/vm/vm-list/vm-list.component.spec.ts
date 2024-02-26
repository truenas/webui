import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { Subject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { VmWizardComponent } from 'app/pages/vm/vm-wizard/vm-wizard.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { VmService } from 'app/services/vm.service';
import { VmListComponent } from './vm-list.component';

const virtualMachines = [
  {
    id: 2,
    name: 'test',
    autostart: true,
    status: {
      state: VmState.Running,
      pid: 12028,
      domain_state: 'RUNNING',
    },
  },
  {
    id: 3,
    name: 'test_refactoring',
    autostart: false,
    status: {
      state: VmState.Stopped,
      pid: null,
      domain_state: 'SHUTOFF',
    },
  },
] as VirtualMachine[];

describe('VmListComponent', () => {
  let spectator: Spectator<VmListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: VmListComponent,
    imports: [
      AppLoaderModule,
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    declarations: [],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('vm.query', virtualMachines),
      ]),
      mockProvider(SystemGeneralService, {
        isEnterprise: () => false,
      }),
      mockProvider(VmService, {
        refreshVmList$: new Subject(),
        getAvailableMemory: jest.fn(() => of(4096)),
        hasVirtualizationSupport$: of(true),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Running', 'Start on Boot'],
      ['test', '', ''],
      ['test_refactoring', '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens vm wizard when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(VmWizardComponent);
  });
});
