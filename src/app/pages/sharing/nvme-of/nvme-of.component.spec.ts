import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness } from '@truenas/ui-components';
import { MockComponents, MockInstance } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import {
  NvmeOfHost, NvmeOfPort, NvmeOfSubsystem, NvmeOfSubsystemDetails,
} from 'app/interfaces/nvme-of.interface';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemDetailsComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details.component';
import { SubsystemNamespacesCardComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.component';
import { SubsystemPortsCardComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';
import {
  SubsystemsDetailsHeaderComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystems-details-header.component';
import { SubsystemsListComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystems-list.component';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('NvmeOfComponent', () => {
  let spectator: Spectator<NvmeOfComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NvmeOfComponent,
    declarations: [
      MockComponents(
        SubsystemsListComponent,
        SubsystemDetailsComponent,
        SubsystemsDetailsHeaderComponent,
        SubsystemNamespacesCardComponent,
        SubsystemPortsCardComponent,
        NvmeOfConfigurationComponent,
        AddSubsystemComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('tn_connect.config'),
      ]),
      mockAuth(),
      mockProvider(NvmeOfStore, {
        subsystems: () => [{ id: 2 }] as NvmeOfSubsystemDetails[],
        isLoading: () => false,
        ports: () => [] as NvmeOfPort[],
        hosts: () => [] as NvmeOfHost[],
        initialize: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              consolemenu: true,
              serialconsole: true,
              serialport: 'ttyS0',
              serialspeed: '9600',
              motd: 'Welcome back, commander',
            } as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    // The hosted forms are mocked, so seed the signals their panel footers read
    // (`form.canSubmit()` etc.) — the viewChildren bind to these mock instances.
    MockInstance(NvmeOfConfigurationComponent, 'canSubmit', signal(false));
    MockInstance(AddSubsystemComponent, 'isLastStep', signal(false));
    MockInstance(AddSubsystemComponent, 'canProceed', signal(false));
    MockInstance(AddSubsystemComponent, 'canSubmit', signal(false));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  afterEach(() => MockInstance.restore());

  it('opens the Global Configuration side panel when corresponding button is pressed', async () => {
    const configurationButton = await loader.getHarness(TnButtonHarness.with({ label: 'Global Configuration' }));
    await configurationButton.click();

    expect(spectator.component.configPanelOpen()).toBe(true);
  });

  it('shows a table with subsystems', () => {
    const table = spectator.query(SubsystemsListComponent);
    expect(table).toBeTruthy();
  });

  it('initializes the store on load', () => {
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalledTimes(1);
  });

  it('opens the Add Subsystem side panel when the button is pressed', async () => {
    const addSubsystemButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add Subsystem' }));
    await addSubsystemButton.click();

    expect(spectator.component.addSubsystemPanelOpen()).toBe(true);
  });

  it('reloads the store after a subsystem is created', () => {
    spectator.component.addSubsystemPanelOpen.set(true);
    spectator.component.onSubsystemCreated({ name: 'subsys-1' } as NvmeOfSubsystem);

    expect(spectator.component.addSubsystemPanelOpen()).toBe(false);
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalledTimes(2);
  });
});
