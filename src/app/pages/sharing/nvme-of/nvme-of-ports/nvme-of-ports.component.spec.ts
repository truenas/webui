import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { NvmeOfPortsComponent } from 'app/pages/sharing/nvme-of/nvme-of-ports/nvme-of-ports.component';
import { PortFormComponent } from 'app/pages/sharing/nvme-of/port-form/port-form.component';

describe('NvmeOfPortsComponent', () => {
  let spectator: Spectator<NvmeOfPortsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NvmeOfPortsComponent,
    providers: [
      mockProvider(SlideIn),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens PortFormComponent when Add Port is pressed', async () => {
    const addPortButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Port' }));
    await addPortButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(PortFormComponent);
  });
});
