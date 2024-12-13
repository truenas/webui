import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { FibreChannelHost } from 'app/interfaces/fibre-channel.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  VirtualPortsNumberDialogComponent,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('VirtualPortsNumberDialogComponent', () => {
  let spectator: Spectator<VirtualPortsNumberDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: VirtualPortsNumberDialogComponent,
    providers: [
      mockApi([
        mockCall('fc.fc_host.update'),
      ]),
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 123,
          npiv: 4,
        } as FibreChannelHost,
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current number of virtual ports when dialog is opened', async () => {
    const input = await loader.getHarness(IxInputHarness);

    expect(await input.getLabelText()).toBe('Virtual Ports');
    expect(await input.getValue()).toBe('4');
  });

  it('updates number of ports when dialog is submitted', async () => {
    const input = await loader.getHarness(IxInputHarness);
    await input.setValue('5');

    const changeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Change' }));
    await changeButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fc.fc_host.update', [123, { npiv: 5 }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
