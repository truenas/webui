import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import {
  NvmeOfHost, NvmeOfPort, NvmeOfSubsystemDetails,
} from 'app/interfaces/nvme-of.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemNamespacesCardComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.component';
import { SubsystemPortsCardComponent } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';
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
        SubsystemNamespacesCardComponent,
        SubsystemPortsCardComponent,
      ),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => {
          return of({ response: { id: 1 } });
        }),
      }),
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
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens Global Configuration form when corresponding button is pressed', async () => {
    const configurationButton = await loader.getHarness(MatButtonHarness.with({ text: 'Global Configuration' }));
    await configurationButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NvmeOfConfigurationComponent);
  });

  it('shows a table with subsystems', () => {
    const table = spectator.query(SubsystemsListComponent);
    expect(table).toBeTruthy();
  });

  it('initializes store when added', async () => {
    const addSubsystemButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Subsystem' }));
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalledTimes(1);
    await addSubsystemButton.click();
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalledTimes(2);
  });
});
