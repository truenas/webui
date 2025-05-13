import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { HostFormComponent } from 'app/pages/sharing/nvme-of/host-form/host-form.component';
import { NvmeOfHostsComponent } from 'app/pages/sharing/nvme-of/nvme-of-hosts/nvme-of-hosts.component';

describe('NvmeOfHostsComponent', () => {
  let spectator: Spectator<NvmeOfHostsComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NvmeOfHostsComponent,
    providers: [
      mockProvider(SlideIn),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('opens HostFormComponent when Add Host is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Host' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(HostFormComponent);
  });
});
