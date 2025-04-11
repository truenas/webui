import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  Spectator,
  createComponentFactory,
  mockProvider,
} from '@ngneat/spectator/jest';
import { TncStatus, TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

describe('TruenasConnectStatusModalComponent', () => {
  let spectator: Spectator<TruenasConnectStatusModalComponent>;
  let loader: HarnessLoader;
  const config = signal({
    enabled: true,
    ips: ['10.220.36.85'],
    tnc_base_url: 'https://truenas.connect.dev.ixsystems.net/',
    account_service_base_url: 'https://account-service.dev.ixsystems.net/',
    leca_service_base_url: 'https://leca-server.dev.ixsystems.net/',
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig);
  const createComponent = createComponentFactory({
    component: TruenasConnectStatusModalComponent,
    providers: [
      mockProvider(TruenasConnectService, { config }),
      {
        provide: WINDOW,
        useValue: {
          open: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({ detectChanges: false });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();
  });

  it('should open a settings dialog for TNC', async () => {
    const openSpy = jest.spyOn(spectator.inject(MatDialog), 'open');
    const settingsBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Settings',
      }),
    );
    await settingsBtn.click();
    expect(openSpy).toHaveBeenCalledWith(TruenasConnectModalComponent, {
      width: '456px',
    });
  });

  it('should open TNC', async () => {
    const openSpy = jest.spyOn(spectator.inject<Window>(WINDOW), 'open');
    const openBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Open TrueNAS Connect',
      }),
    );
    await openBtn.click();
    expect(openSpy).toHaveBeenCalledWith(config().tnc_base_url);
  });

  it('should display the status as ACTIVE', () => {
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Active);
  });

  it('should display the status as WAITING', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.ClaimTokenMissing }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Waiting);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Waiting);
  });

  it('should display the status as CONNECTING', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Connecting);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Connecting);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Connecting);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Connecting);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Connecting);
  });

  it('should display the status as FAILED', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Failed);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationTimeout }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Failed);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Failed);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertConfigurationFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Failed);

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Failed);
  });

  it('should display the status as DISABLED', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Disabled }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Disabled);
  });
});
