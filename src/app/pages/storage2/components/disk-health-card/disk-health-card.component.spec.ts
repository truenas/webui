import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DiskHealthCardComponent } from 'app/pages/storage2/components/disk-health-card/disk-health-card.component';

describe('DiskHealthCardComponent', () => {
  let spectator: Spectator<DiskHealthCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DiskHealthCardComponent,
    providers: [
      mockProvider(SnackbarService),
      mockWebsocket([
        mockCall('disk.temperatures'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a button to manage all disks', async () => {
    const manageDisksButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage Disks' }));

    expect(manageDisksButton).toBeTruthy();
    expect(await (await manageDisksButton.host()).getAttribute('href')).toBe('/storage2/disks');
  });
});
