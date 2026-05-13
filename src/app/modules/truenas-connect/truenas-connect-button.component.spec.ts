import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnSpriteLoaderService } from '@truenas/ui-components';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { TruenasConnectButtonComponent } from 'app/modules/truenas-connect/truenas-connect-button.component';
import { tierDisplayConfig } from 'app/modules/truenas-connect/truenas-connect-tier.utils';

describe('TruenasConnectButtonComponent', () => {
  let spectator: Spectator<TruenasConnectButtonComponent>;
  let loader: HarnessLoader;
  const configSignal = signal<TruenasConnectConfig>({
    enabled: true,
    ips: ['10.220.36.85'],
    interfaces_ips: [],
    tnc_base_url: 'https://truenas.connect.dev.ixsystems.net/',
    account_service_base_url: 'https://account-service.dev.ixsystems.net/',
    leca_service_base_url: 'https://leca-server.dev.ixsystems.net/',
    status: TruenasConnectStatus.Configured,
    tier: null,
  } as TruenasConnectConfig);
  const createComponent = createComponentFactory({
    component: TruenasConnectButtonComponent,
    providers: [
      mockProvider(TruenasConnectService, {
        config: configSignal,
        openStatusModal: jest.fn(),
      }),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Configured,
      tier: null,
    } as TruenasConnectConfig);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should popup the TNC service status', async () => {
    const truenasConnectService = spectator.inject(TruenasConnectService);
    const statusBtn = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="tnc-show-status"]' }),
    );
    await statusBtn.click();
    expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
  });

  [
    TruenasConnectTier.Foundation,
    TruenasConnectTier.Plus,
    TruenasConnectTier.Business,
  ].forEach((tier) => {
    it(`shows the tier badge for ${tier} when status is Configured`, () => {
      configSignal.set({
        enabled: true,
        status: TruenasConnectStatus.Configured,
        tier,
      } as TruenasConnectConfig);
      spectator.detectChanges();

      const { short, background } = tierDisplayConfig[tier];
      const badge = spectator.query<HTMLElement>('ix-status-badge');
      expect(badge).toExist();
      expect(badge?.style.background).toBe(background);
      expect(badge?.textContent?.trim()).toBe(short);
    });
  });

  it('shows a green success badge when status is Configured with no tier', () => {
    const badge = spectator.query<HTMLElement>('ix-status-badge');
    expect(badge).toExist();
    expect(badge?.style.background).toBe('var(--green)');
  });

  it('does not show a badge when status is Disabled even if tier is set', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Disabled,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    expect(spectator.query('ix-status-badge')).not.toExist();
  });

  it('shows a red error badge for failed certificate statuses', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.CertRenewalFailure,
      tier: null,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    const badge = spectator.query<HTMLElement>('ix-status-badge');
    expect(badge).toExist();
    expect(badge?.style.background).toBe('var(--red)');
  });

  it('does not show a badge for the Disabled status', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Disabled,
      tier: null,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    expect(spectator.query('ix-status-badge')).not.toExist();
  });

  [
    TruenasConnectStatus.RegistrationFinalizationWaiting,
    TruenasConnectStatus.RegistrationFinalizationSuccess,
    TruenasConnectStatus.CertGenerationInProgress,
    TruenasConnectStatus.CertGenerationSuccess,
    TruenasConnectStatus.CertRenewalInProgress,
    TruenasConnectStatus.CertRenewalSuccess,
  ].forEach((status) => {
    it(`shows a yellow warning badge for in-progress status ${status}`, () => {
      configSignal.set({
        enabled: true,
        status,
        tier: null,
      } as TruenasConnectConfig);
      spectator.detectChanges();

      const badge = spectator.query<HTMLElement>('ix-status-badge');
      expect(badge).toExist();
      expect(badge?.style.background).toBe('var(--yellow)');
    });
  });
});
