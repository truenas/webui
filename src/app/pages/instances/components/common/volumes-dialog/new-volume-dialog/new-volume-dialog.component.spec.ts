import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { NewVolumeDialogComponent } from './new-volume-dialog.component';

describe('NewVolumeDialogComponent', () => {
  let spectator: Spectator<NewVolumeDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NewVolumeDialogComponent,
    providers: [
      mockProvider(MatDialogRef),
      mockApi([
        mockCall('virt.volume.create'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a new volume and closes the dialog', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Name: 'new-volume',
      Size: 2048,
    });

    const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
    await createButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.volume.create', [{
      name: 'new-volume',
      size: 2048,
    }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
