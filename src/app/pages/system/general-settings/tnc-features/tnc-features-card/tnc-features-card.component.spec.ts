import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnBannerHarness, TnButtonHarness } from '@truenas/ui-components';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { LicenseType } from 'app/enums/license-type.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { License, LicenseFeatureInfo, SystemInfo } from 'app/interfaces/system-info.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { LocaleService } from 'app/modules/language/locale.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import {
  TncFeaturesCardComponent,
} from 'app/pages/system/general-settings/tnc-features/tnc-features-card/tnc-features-card.component';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { selectLicense, selectSystemInfo } from 'app/store/system-info/system-info.selectors';

const now = Date.UTC(2026, 9, 21, 12);

function communityLicense(expiresAt: string): License {
  return {
    type: LicenseType.Community,
    features: [
      { name: EntitlementFeature.Webshare, expires_at: { $type: 'date', $value: expiresAt } },
    ] as LicenseFeatureInfo[],
  } as License;
}

describe('TncFeaturesCardComponent', () => {
  let spectator: Spectator<TncFeaturesCardComponent>;
  let loader: HarnessLoader;
  let store$: MockStore;

  const createComponent = createComponentFactory({
    component: TncFeaturesCardComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectLicense, value: communityLicense('2027-06-01') },
          { selector: selectEntitlements, value: {} },
          { selector: selectSystemInfo, value: { datetime: { $date: now } } as SystemInfo },
        ],
      }),
      mockProvider(LocaleService, {
        getPreferredDateFormat: jest.fn(() => 'yyyy-MM-dd'),
      }),
      {
        provide: WINDOW,
        useValue: { open: jest.fn() },
      },
      mockProvider(TruenasConnectService, {
        config: signal({ tier: TruenasConnectTier.Plus } as TruenasConnectConfig),
      }),
    ],
  });

  function setLicense(license: License | null): void {
    store$.overrideSelector(selectLicense, license);
    store$.refreshState();
    spectator.detectChanges();
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('names the membership that provides the features while it is active', async () => {
    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('Provided by your TrueNAS Connect Plus membership');
    expect(spectator.query('tn-banner .tn-banner--info')).toExist();

    expect(spectator.query('.tnc-feature')).toHaveText('Webshare');
    expect(spectator.query('.tnc-feature')).toHaveText('Until 2027-06-01');
    expect(await (await loader.getHarness(TnButtonHarness)).getLabel()).toBe('Manage Membership');
  });

  it('opens TrueNAS Connect to manage the membership', async () => {
    await (await loader.getHarness(TnButtonHarness.with({ label: 'Manage Membership' }))).click();

    expect(spectator.inject<Window>(WINDOW).open).toHaveBeenCalledWith(
      'https://connect.truenas.com/',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('warns when the features are about to expire', async () => {
    setLicense(communityLicense('2026-11-10'));

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('TrueNAS Connect features expire in 20 days');
    expect(spectator.query('tn-banner .tn-banner--warning')).toExist();
    expect(spectator.query('.tnc-feature')).toHaveText('Expires in 20 days');
  });

  it('turns to an error close to expiry and offers to renew', async () => {
    setLicense(communityLicense('2026-10-24'));

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('will be disabled after 2026-10-24');
    expect(spectator.query('tn-banner .tn-banner--error')).toExist();
    expect(spectator.query('.tnc-feature')).toHaveClass('critical');
    expect(await (await loader.getHarness(TnButtonHarness)).getLabel()).toBe('Renew Membership');
  });

  it('says the membership has expired once it has', async () => {
    setLicense(communityLicense('2026-10-01'));

    const banner = await loader.getHarness(TnBannerHarness);
    expect(await banner.getText()).toContain('Your TrueNAS Connect membership has expired');
    expect(spectator.query('.tnc-feature')).toHaveText('Expired 2026-10-01');
  });

  it('renders nothing without a subscription-provided license', () => {
    setLicense(null);

    expect(spectator.query('tn-card')).not.toExist();
    expect(spectator.element).toHaveStyle({ display: 'none' });
  });
});
