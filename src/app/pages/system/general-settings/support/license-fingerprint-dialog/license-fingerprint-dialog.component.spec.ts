import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { DialogRef } from '@angular/cdk/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import {
  buildFingerprintField,
  formatFingerprintLabel,
  LicenseFingerprintDialog,
} from 'app/pages/system/general-settings/support/license-fingerprint-dialog/license-fingerprint-dialog.component';

const passthroughTranslate = { instant: (key: string) => key } as TranslateService;

describe('formatFingerprintLabel', () => {
  it('returns the known label for a known key', () => {
    expect(formatFingerprintLabel('macs')).toBe('MAC Addresses');
    expect(formatFingerprintLabel('smbios_uuid')).toBe('SMBIOS UUID');
  });

  it('title-cases unknown snake_case keys as a fallback', () => {
    expect(formatFingerprintLabel('some_new_field')).toBe('Some New Field');
    expect(formatFingerprintLabel('notes')).toBe('Notes');
  });
});

describe('buildFingerprintField', () => {
  it('wraps a primitive value in a single-element values array', () => {
    expect(buildFingerprintField('product_serial', 'vm002', passthroughTranslate)).toEqual({
      key: 'product_serial',
      label: 'Product Serial',
      values: ['vm002'],
    });
  });

  it('renders booleans using translatable Yes/No', () => {
    expect(buildFingerprintField('ha_enabled', true, passthroughTranslate).values).toEqual(['Yes']);
    expect(buildFingerprintField('ha_enabled', false, passthroughTranslate).values).toEqual(['No']);
  });

  it('renders null and empty strings as an em dash placeholder', () => {
    expect(buildFingerprintField('chassis_serial', null, passthroughTranslate).values).toEqual(['—']);
    expect(buildFingerprintField('notes', '', passthroughTranslate).values).toEqual(['—']);
  });

  it('expands arrays of primitives into individual values', () => {
    const field = buildFingerprintField('macs', ['52:54:00:9e:46:f4', '52:54:00:9e:46:f5'], passthroughTranslate);
    expect(field.values).toEqual(['52:54:00:9e:46:f4', '52:54:00:9e:46:f5']);
  });

  it('renders an empty array as the placeholder', () => {
    expect(buildFingerprintField('macs', [], passthroughTranslate).values).toEqual(['—']);
  });
});

describe('LicenseFingerprintDialog', () => {
  const payload = {
    macs: ['52:54:00:9e:46:f4'],
    cpu_id: 'AuthenticAMD-25-1-1',
    product_serial: 'vm002',
  };
  const base64 = btoa(JSON.stringify(payload));

  let spectator: Spectator<LicenseFingerprintDialog>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: LicenseFingerprintDialog,
    providers: [
      mockAuth(),
      mockApi([mockCall('truenas.license.fingerprint', base64)]),
      mockProvider(DialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('fetches the fingerprint on init and renders one row per decoded key', () => {
    const rows = spectator.queryAll('.fingerprint-fields .field');
    expect(rows).toHaveLength(Object.keys(payload).length);
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

describe('LicenseFingerprintDialog fallback rendering', () => {
  const malformedRaw = 'not-base64!@#';

  const createComponent = createComponentFactory({
    component: LicenseFingerprintDialog,
    providers: [
      mockAuth(),
      mockApi([mockCall('truenas.license.fingerprint', malformedRaw)]),
      mockProvider(DialogRef),
    ],
  });

  it('renders the raw payload when decoding fails', () => {
    const spectator = createComponent();
    expect(spectator.query('.fingerprint-fields')).toBeNull();
    expect(spectator.query('.fingerprint-raw')!.textContent!.trim()).toBe(malformedRaw);
  });
});
