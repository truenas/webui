import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';
import { DownloadClientConfigModalComponent } from './download-client-config-modal.component';

describe('DownloadClientConfigModalComponent', () => {
  let spectator: Spectator<DownloadClientConfigModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DownloadClientConfigModalComponent,
    imports: [
      AppLoaderModule,
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('interface.websocket_local_ip', '127.0.0.1'),
      ]),
      mockProvider(ServicesService, {
        generateOpenServerClientConfig: jest.fn(() => of('Key')),
        getCerts: jest.fn(() => of([
          { id: 1, name: 'Certificates 1' },
          { id: 2, name: 'Certificates 2' },
        ])),
      }),
      mockProvider(StorageService, {
        downloadText: jest.fn(),
      }),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a list of client certificates', async () => {
    const certificatesSelect = await loader.getHarness(IxSelectHarness);
    const matSelect = await certificatesSelect.getSelectHarness();
    await matSelect.open();
    const options = await matSelect.getOptions();

    const optionLabels = await parallel(() => options.map((option) => option.getText()));
    expect(optionLabels).toEqual(['Certificates 1', 'Certificates 2']);
  });

  it('downloads OpenVPN client config when dialog is submitted', async () => {
    const certificatesSelect = await loader.getHarness(IxSelectHarness);
    await certificatesSelect.setValue('Certificates 2');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('interface.websocket_local_ip');
    expect(spectator.inject(ServicesService).generateOpenServerClientConfig).toHaveBeenCalledWith(2, '127.0.0.1');
    expect(spectator.inject(StorageService).downloadText).toHaveBeenCalledWith('Key', 'openVPNClientConfig.ovpn');
  });
});
