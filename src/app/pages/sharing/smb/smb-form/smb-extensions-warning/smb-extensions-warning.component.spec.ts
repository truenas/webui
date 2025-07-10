import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SmbExtensionsWarningComponent } from './smb-extensions-warning.component';

describe('SmbExtensionsWarningComponent', () => {
  let spectator: Spectator<SmbExtensionsWarningComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: SmbExtensionsWarningComponent,
    providers: [
      mockApi([
        mockCall('smb.update'),
      ]),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows the warning', () => {
    expect(spectator.query('.warning-text')).toHaveText(
      'This parameter requires Apple SMB2/3 protocol extension support to be enabled in SMB service.',
    );
    expect(spectator.query('[ixTest="enable-apple-extensions"]')).toHaveText('Enable Now');
  });

  it('updates SMB config when Enable Now is pressed', async () => {
    jest.spyOn(spectator.component.extensionsEnabled, 'emit');

    const enableButton = await loader.getHarness(MatButtonHarness.with({
      text: 'Enable Now',
    }));

    await enableButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('smb.update', [{ aapl_extensions: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      'Apple SMB2/3 protocol extension support has been enabled.',
    );
    expect(spectator.component.extensionsEnabled.emit).toHaveBeenCalled();
  });
});
