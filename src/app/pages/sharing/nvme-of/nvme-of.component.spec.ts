import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTabNavBarHarness } from '@angular/material/tabs/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfComponent } from 'app/pages/sharing/nvme-of/nvme-of.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

describe('NvmeOfComponent', () => {
  let spectator: Spectator<NvmeOfComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NvmeOfComponent,
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => {
          return of({ response: { id: 1 } });
        }),
      }),
      mockAuth(),
      mockProvider(NvmeOfStore, {
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

  it('shows a navtab with supported links', async () => {
    const navbar = await loader.getHarness(MatTabNavBarHarness);
    const links = await navbar.getLinks();

    expect(links).toHaveLength(3);
    expect(await links[0].getLabel()).toBe('Subsystems');
    expect(await links[1].getLabel()).toBe('Hosts');
    expect(await links[2].getLabel()).toBe('Ports');
  });

  it('initializes store when added', async () => {
    const button = await loader.getHarness(MatButtonHarness.with({ text: 'Add Subsystem' }));
    expect(spectator.inject(NvmeOfStore).initialize).not.toHaveBeenCalled();
    await button.click();
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
  });
});
