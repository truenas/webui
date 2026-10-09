import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { FibreChannelHost } from 'app/interfaces/fibre-channel.interface';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  VirtualPortsNumberDialog,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/virtual-ports-number-dialog/virtual-ports-number-dialog.component';

describe('VirtualPortsNumberDialogComponent', () => {
  let spectator: Spectator<VirtualPortsNumberDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: VirtualPortsNumberDialog,
    providers: [
      mockTypedApi([
        mockTypedCall('fc.fc_host.update', null),
      ]),
      mockProvider(DialogRef),
      {
        provide: DIALOG_DATA,
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
    const field = await loader.getHarness(TnFormFieldHarness);
    const input = await loader.getHarness(TnInputHarness);

    expect(await field.getLabel()).toBe('Virtual Ports');
    expect(await input.getValue()).toBe('4');
  });

  it('updates number of ports when dialog is submitted', async () => {
    const input = await loader.getHarness(TnInputHarness);
    await input.setValue('5');

    const changeButton = await loader.getHarness(TnButtonHarness.with({ label: 'Change' }));
    await changeButton.click();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('fc.fc_host.update', [123, { npiv: 5 }]);
    expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith(true);
  });
});
