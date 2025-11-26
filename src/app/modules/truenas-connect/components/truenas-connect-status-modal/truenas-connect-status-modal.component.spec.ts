import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  Spectator,
  createComponentFactory,
  mockProvider,
} from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { HarborosConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { HarborosConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { HarborosConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { HarborosConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

describe('HarborosConnectStatusModalComponent', () => {
  let spectator: Spectator<HarborosConnectStatusModalComponent>;
  let loader: HarnessLoader;

  const config = signal({
    enabled: true,
    ips: ['10.220.36.85'],
    interfaces_ips: [],
    tnc_base_url: 'https://truenas.connect.dev.ixsystems.net/',
    account_service_base_url: 'https://account-service.dev.ixsystems.net/',
    leca_service_base_url: 'https://leca-server.dev.ixsystems.net/',
    status: HarborosConnectStatus.Configured,
  } as HarborosConnectConfig);

  const createComponent = createComponentFactory({
    component: HarborosConnectStatusModalComponent,
    imports: [NoopAnimationsModule],
    providers: [
      mockProvider(HarborosConnectService, {
        config,
        connect: jest.fn(() => of(null)),
        disableService: jest.fn(() => of(null)),
        enableService: jest.fn(() => of(null)),
        generateToken: jest.fn(() => of('')),
        openHarborosConnectWindow: jest.fn(),
      }),
      mockProvider(DialogService, {
        error: jest.fn(),
        confirm: jest.fn(() => of(true)),
      }),
      {
        provide: WINDOW,
        useValue: {
          open: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    // Reset config to a known state before each test
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should show Open HarborOS Connect button when configured', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator.detectChanges();

    const openBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Open HarborOS Connect',
      }),
    );
    expect(openBtn).toBeTruthy();

    const tncService = spectator.inject(HarborosConnectService);
    const openHarborosConnectWindowSpy = jest.spyOn(tncService, 'openHarborosConnectWindow');
    await openBtn.click();
    expect(openHarborosConnectWindowSpy).toHaveBeenCalledWith(config().tnc_base_url);
  });

  it('should display the status as ACTIVE', () => {
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('HarborOS Connect - Status Healthy');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Your system is linked with HarborOS Connect');
  });

  it('should display the status as WAITING', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.ClaimTokenMissing }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]')).toBeNull();

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]')).toBeNull();
  });

  it('should show "Get Connected" button in waiting state', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();

    const connectSpy = jest.spyOn(spectator.inject(HarborosConnectService), 'connect');
    const getConnectedBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Get Connected',
      }),
    );
    await getConnectedBtn.click();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should call generateToken when status is ClaimTokenMissing', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.ClaimTokenMissing }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const generateTokenSpy = jest.spyOn(service, 'generateToken');
    const connectSpy = jest.spyOn(service, 'connect');

    const getConnectedBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Get Connected',
      }),
    );
    await getConnectedBtn.click();

    expect(generateTokenSpy).toHaveBeenCalled();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should handle error when clicking Get Connected button', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const connectSpy = jest.spyOn(service, 'connect').mockReturnValue(throwError(() => new Error('Connection failed')));
    const dialogService = spectator.inject(DialogService);
    const errorSpy = jest.spyOn(dialogService, 'error');

    const getConnectedBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Get Connected',
      }),
    );
    await getConnectedBtn.click();

    expect(connectSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should handle error when generateToken fails', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.ClaimTokenMissing }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const generateTokenSpy = jest.spyOn(service, 'generateToken').mockReturnValue(throwError(() => new Error('Token generation failed')));
    const dialogService = spectator.inject(DialogService);
    const errorSpy = jest.spyOn(dialogService, 'error');

    const getConnectedBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Get Connected',
      }),
    );
    await getConnectedBtn.click();

    expect(generateTokenSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should show disable service button when configured', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator.detectChanges();

    const dialogService = spectator.inject(DialogService);
    (dialogService as { confirm: jest.Mock }).confirm = jest.fn(() => of(true));
    const confirmSpy = dialogService.confirm as jest.Mock;
    const disableSpy = jest.spyOn(spectator.inject(HarborosConnectService), 'disableService');
    const disableBtn = spectator.query('[ixTest="tnc-disable-service"]');
    expect(disableBtn).toBeTruthy();

    spectator.click(disableBtn);
    expect(confirmSpy).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
      buttonText: expect.any(String),
    });
    expect(disableSpy).toHaveBeenCalled();
  });

  it('should handle error when clicking disable service button', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const disableSpy = jest.spyOn(service, 'disableService').mockReturnValue(throwError(() => new Error('Disable failed')));
    const dialogService = spectator.inject(DialogService);
    (dialogService as { confirm: jest.Mock }).confirm = jest.fn(() => of(true));
    const confirmSpy = dialogService.confirm as jest.Mock;
    const errorSpy = jest.spyOn(dialogService, 'error');

    const disableBtn = spectator.query('[ixTest="tnc-disable-service"]');
    spectator.click(disableBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(disableSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should not disable service when user cancels confirmation', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const disableSpy = jest.spyOn(service, 'disableService');
    const dialogService = spectator.inject(DialogService);
    (dialogService as { confirm: jest.Mock }).confirm = jest.fn(() => of(false));
    const confirmSpy = dialogService.confirm as jest.Mock;

    const disableBtn = spectator.query('[ixTest="tnc-disable-service"]');
    spectator.click(disableBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(disableSpy).not.toHaveBeenCalled();
  });

  it('should display the status as CONNECTING with custom text', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up HarborOS Connect');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Your system is setting up with HarborOS Connect');
    expect(spectator.query('ix-truenas-connect-spinner')).toBeTruthy();

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertGenerationInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up HarborOS Connect');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertGenerationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up HarborOS Connect');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertRenewalInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up HarborOS Connect');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertRenewalSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up HarborOS Connect');
  });

  it('should display custom error message for FAILED state', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Something went wrong!');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationTimeout }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertGenerationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertConfigurationFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.CertRenewalFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');
  });

  it('should display disabled status as WAITING (shows Get Connected button)', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Disabled }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status-reason"]')).toHaveText('Power Up your HarborOS Experience! Link your system with HarborOS Connect now for additional security, alerting, and other features.');
  });

  it('should not automatically enable service when dialog opens (removed behavior)', () => {
    // Update the config to disabled state
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Disabled, enabled: false }));

    const service = spectator.inject(HarborosConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');

    spectator.detectChanges();

    // Service should NOT be automatically enabled when dialog opens
    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('should show "Retry Connection" button in failed state and retry process', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const disableSpy = jest.spyOn(service, 'disableService').mockReturnValue(of(null));
    const enableSpy = jest.spyOn(service, 'enableService').mockReturnValue(of(null));
    const connectSpy = jest.spyOn(service, 'connect').mockReturnValue(of(null));

    const retryBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Retry Connection',
      }),
    );
    await retryBtn.click();

    expect(disableSpy).toHaveBeenCalled();
    expect(enableSpy).toHaveBeenCalled();
    expect(connectSpy).not.toHaveBeenCalled();
  });

  it('should handle error when clicking Retry Connection button', async () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();

    const service = spectator.inject(HarborosConnectService);
    const disableSpy = jest.spyOn(service, 'disableService').mockReturnValue(throwError(() => new Error('Retry failed')));
    const dialogService = spectator.inject(DialogService);
    const errorSpy = jest.spyOn(dialogService, 'error');

    const retryBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Retry Connection',
      }),
    );
    await retryBtn.click();

    expect(disableSpy).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith({
      title: expect.any(String),
      message: expect.any(String),
    });
  });

  it('should display waiting status correctly', () => {
    const waitingStatuses = [
      HarborosConnectStatus.ClaimTokenMissing,
      HarborosConnectStatus.RegistrationFinalizationWaiting,
    ];

    waitingStatuses.forEach((status) => {
      config.update((conf) => ({ ...conf, status }));
      spectator.detectChanges();

      const statusElement = spectator.query('[ixTest="tnc-status"]');
      const statusReasonElement = spectator.query('[ixTest="tnc-status-reason"]');

      expect(statusElement).toBeNull();
      expect(statusReasonElement).toBeTruthy();
      expect(statusReasonElement?.textContent).toContain('Power Up your HarborOS Experience');
    });
  });

  it('should display connecting status correctly', () => {
    const connectingStatuses = [
      HarborosConnectStatus.RegistrationFinalizationSuccess,
      HarborosConnectStatus.CertGenerationInProgress,
      HarborosConnectStatus.CertGenerationSuccess,
      HarborosConnectStatus.CertRenewalInProgress,
      HarborosConnectStatus.CertRenewalSuccess,
    ];

    connectingStatuses.forEach((status) => {
      config.update((conf) => ({ ...conf, status }));
      spectator.detectChanges();

      const statusElement = spectator.query('[ixTest="tnc-status"]');
      expect(statusElement).toBeTruthy();
      expect(statusElement?.textContent).toContain('Setting up HarborOS Connect');
    });
  });

  it('should display failed status correctly', () => {
    const failedStatuses = [
      HarborosConnectStatus.RegistrationFinalizationFailed,
      HarborosConnectStatus.RegistrationFinalizationTimeout,
      HarborosConnectStatus.CertGenerationFailed,
      HarborosConnectStatus.CertConfigurationFailure,
      HarborosConnectStatus.CertRenewalFailure,
    ];

    failedStatuses.forEach((status) => {
      config.update((conf) => ({ ...conf, status }));
      spectator.detectChanges();

      const statusElement = spectator.query('[ixTest="tnc-status"]');
      expect(statusElement).toBeTruthy();
      expect(statusElement?.textContent).toContain('Connection Failed...');
    });
  });

  it('should display configured status as active', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));
    spectator.detectChanges();

    const statusElement = spectator.query('[ixTest="tnc-status"]');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toContain('HarborOS Connect - Status Healthy');
  });

  it('should display disabled status as waiting (no longer shows DISABLED)', () => {
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Disabled }));
    spectator.detectChanges();

    // Disabled status now maps to waiting which shows different content
    const statusElement = spectator.query('[ixTest="tnc-status-reason"]');
    expect(statusElement).toBeTruthy();
    expect(statusElement?.textContent).toContain('Power Up your HarborOS Experience!');
  });

  it('should not auto-enable service when status is configured', () => {
    // Reset config to Configured status
    config.update((conf) => ({ ...conf, status: HarborosConnectStatus.Configured }));

    const service = spectator.inject(HarborosConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');

    spectator.detectChanges();

    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('should handle null config gracefully', () => {
    // Set config to null
    config.set(null);

    // Should not throw error when rendering with null config
    expect(() => spectator.detectChanges()).not.toThrow();

    // Should not call enableService when config is null
    const service = spectator.inject(HarborosConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');
    spectator.detectChanges();
    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('should handle undefined status in config', () => {
    config.update((conf) => ({ ...conf, status: undefined as HarborosConnectStatus }));
    spectator.detectChanges();

    // Undefined status maps to waiting (default case)
    const statusElement = spectator.query('[ixTest="tnc-status-reason"]');
    expect(statusElement).toBeTruthy();
    expect(statusElement!.textContent).toContain('Power Up your HarborOS Experience!');
  });
});
