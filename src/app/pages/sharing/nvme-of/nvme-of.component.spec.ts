import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { SubsystemsListComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystems-list.component';

describe('NvmeOfComponent', () => {
  let spectator: Spectator<NvmeOfComponent>;
  let loader: HarnessLoader;
  const subsystems = [] as NvmeOfSubsystemDetails[];
  const createComponent = createComponentFactory({
    component: NvmeOfComponent,
    imports: [
      MockComponent(SubsystemsListComponent),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => {
          return of({ response: { id: 1 } });
        }),
      }),
      mockAuth(),
      mockProvider(NvmeOfStore, {
        subsystems: () => subsystems,
        isLoading: () => false,
        initialize: jest.fn(),
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
