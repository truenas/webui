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
  const payload = {
    system_serial: 'A1',
    hardware_model: 'M60',
    customer_id: 42,
    ha_enabled: true,
    feature_flags: ['vm', 'replication'],
    notes: null,
  };
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

  it('fetches the fingerprint on init and renders decoded fields as labeled key/value pairs', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('truenas.license.fingerprint');

    const labels = spectator.queryAll('.fingerprint-fields .field-label').map((el) => el.textContent!.trim());
    expect(labels).toEqual(['System Serial', 'Hardware Model', 'Customer Id', 'Ha Enabled', 'Feature Flags', 'Notes']);

    const rows = spectator.queryAll('.fingerprint-fields .field');
    const singleValues = [0, 1, 2, 3, 5].map((index) => rows[index].querySelector('.field-value')!.textContent!.trim());
    expect(singleValues).toEqual(['A1', 'M60', '42', 'true', '—']);

    const arrayItems = rows[4].querySelectorAll('.field-list li');
    expect(Array.from(arrayItems).map((el) => el.textContent!.trim())).toEqual(['vm', 'replication']);
  });

  it('does not mention iX in the dialog copy', () => {
    expect(spectator.fixture.nativeElement.textContent).not.toMatch(/\biX\b/);
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
