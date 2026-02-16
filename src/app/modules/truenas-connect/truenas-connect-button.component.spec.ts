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

  it('should not show badge when tier is null', () => {
    expect(spectator.query('.tier-badge')).not.toExist();
  });

  it('should show Foundation badge when tier is FOUNDATION and status is Configured', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Foundation,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    const badge = spectator.query('.tier-badge');
    expect(badge).toExist();
    expect(badge).toHaveText('F');
    expect(badge).toHaveClass('tier-foundation');
  });

  it('should show Plus badge when tier is PLUS and status is Configured', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    const badge = spectator.query('.tier-badge');
    expect(badge).toExist();
    expect(badge).toHaveText('+');
    expect(badge).toHaveClass('tier-plus');
  });

  it('should show Business badge when tier is BUSINESS and status is Configured', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Business,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    const badge = spectator.query('.tier-badge');
    expect(badge).toExist();
    expect(badge).toHaveText('B');
    expect(badge).toHaveClass('tier-business');
  });

  it('should not show badge when status is not Configured even if tier is set', () => {
    configSignal.set({
      enabled: true,
      status: TruenasConnectStatus.Disabled,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);
    spectator.detectChanges();

    expect(spectator.query('.tier-badge')).not.toExist();
  });
});
