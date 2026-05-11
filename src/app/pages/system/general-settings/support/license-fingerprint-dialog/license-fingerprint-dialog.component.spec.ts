import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  LicenseFingerprintDialog,
} from 'app/pages/system/general-settings/support/license-fingerprint-dialog/license-fingerprint-dialog.component';

describe('LicenseFingerprintDialog', () => {
  const payload = { system_serial: 'A1', hardware_model: 'M60', customer_id: 42 };
  const base64 = btoa(JSON.stringify(payload));

  let spectator: Spectator<LicenseFingerprintDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: LicenseFingerprintDialog,
    providers: [
      mockAuth(),
      mockApi([mockCall('truenas.license.fingerprint', base64)]),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('fetches the fingerprint on init and renders pretty-printed JSON', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.license.fingerprint');

    const decoded = spectator.query('.fingerprint-decoded');
    expect(decoded).toExist();
    expect(JSON.parse(decoded!.textContent!.trim())).toEqual(payload);
  });

  it('copies the raw base64 string when the copy button is clicked', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const copyButton = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="copy-fingerprint"]' }),
    );
    await copyButton.click();

    expect(writeText).toHaveBeenCalledWith(base64);
  });
});
