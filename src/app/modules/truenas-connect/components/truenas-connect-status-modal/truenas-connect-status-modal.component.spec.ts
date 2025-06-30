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
import { of } from 'rxjs';
import { TncStatus, TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { MockTruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner-mock.component';
import { TruenasConnectSpinnerComponent } from 'app/modules/truenas-connect/components/truenas-connect-spinner/truenas-connect-spinner.component';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

describe('TruenasConnectStatusModalComponent', () => {
  let spectator: Spectator<TruenasConnectStatusModalComponent>;
  let loader: HarnessLoader;

  // No need for animation mocks since we're using MockTruenasConnectSpinnerComponent

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
    imports: [NoopAnimationsModule],
    overrideComponents: [
      [
        TruenasConnectStatusModalComponent,
        {
          remove: { imports: [TruenasConnectSpinnerComponent] },
          add: { imports: [MockTruenasConnectSpinnerComponent] },
        },
      ],
    ],
    providers: [
      mockProvider(TruenasConnectService, {
        config,
        connect: jest.fn(() => of(null)),
        disableService: jest.fn(() => of(null)),
        enableService: jest.fn(() => of(null)),
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
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Configured }));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should show Close and Open TrueNAS Connect buttons when configured', async () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Configured }));
    spectator.detectChanges();

    const closeBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Close',
      }),
    );
    expect(closeBtn).toBeTruthy();

    const openBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Open TrueNAS Connect',
      }),
    );
    expect(openBtn).toBeTruthy();

    const openSpy = jest.spyOn(spectator.inject<Window>(WINDOW), 'open');
    await openBtn.click();
    expect(openSpy).toHaveBeenCalledWith(config().tnc_base_url);
  });

  it('should display the status as ACTIVE', () => {
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('TrueNAS Connect - Status Healthy');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Your system is linked with TrueNAS Connect');
  });

  it('should display the status as WAITING', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.ClaimTokenMissing }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]')).toBeNull();

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]')).toBeNull();
  });

  it('should show "Get Connected" button in waiting state', async () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationWaiting }));
    spectator.detectChanges();

    const connectSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'connect');
    const getConnectedBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Get Connected',
      }),
    );
    await getConnectedBtn.click();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should show disable service button when configured', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Configured }));
    spectator.detectChanges();

    const disableSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'disableService');
    const disableBtn = spectator.query('[ixTest="tnc-disable-service"]');
    expect(disableBtn).toBeTruthy();

    spectator.click(disableBtn);
    expect(disableSpy).toHaveBeenCalled();
  });

  it('should display the status as CONNECTING with custom text', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up TrueNAS Connect');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Your system is setting up with TrueNAS Connect');
    expect(spectator.query('ix-truenas-connect-spinner')).toBeTruthy();

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up TrueNAS Connect');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up TrueNAS Connect');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalInProgress }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up TrueNAS Connect');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalSuccess }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Setting up TrueNAS Connect');
  });

  it('should display custom error message for FAILED state', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');
    expect(spectator.query('[ixTest="tnc-status-reason"]').textContent).toContain('Something went wrong!');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationTimeout }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertGenerationFailed }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertConfigurationFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');

    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.CertRenewalFailure }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').textContent).toContain('Connection Failed...');
  });

  it('should display the status as DISABLED', () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Disabled }));
    spectator.detectChanges();
    expect(spectator.query('[ixTest="tnc-status"]').innerHTML).toBe(TncStatus.Disabled);
  });

  it('should automatically re-enable service when status is DISABLED', () => {
    // Update the config to disabled state
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Disabled, enabled: false }));

    const service = spectator.inject(TruenasConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');

    // Create a new component instance which should trigger ngOnInit
    spectator.component.ngOnInit();

    expect(enableSpy).toHaveBeenCalled();
  });

  it('should show "Retry Connection" button in failed state and retry process', async () => {
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.RegistrationFinalizationFailed }));
    spectator.detectChanges();

    const service = spectator.inject(TruenasConnectService);
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

  it('should compute status correctly for all TruenasConnectStatus values', () => {
    // Test that each status maps to the correct TncStatus
    const statusMappings = [
      { input: TruenasConnectStatus.Configured, expected: TncStatus.Active },
      { input: TruenasConnectStatus.ClaimTokenMissing, expected: TncStatus.Waiting },
      { input: TruenasConnectStatus.RegistrationFinalizationWaiting, expected: TncStatus.Waiting },
      { input: TruenasConnectStatus.RegistrationFinalizationSuccess, expected: TncStatus.Connecting },
      { input: TruenasConnectStatus.CertGenerationInProgress, expected: TncStatus.Connecting },
      { input: TruenasConnectStatus.CertGenerationSuccess, expected: TncStatus.Connecting },
      { input: TruenasConnectStatus.CertRenewalInProgress, expected: TncStatus.Connecting },
      { input: TruenasConnectStatus.CertRenewalSuccess, expected: TncStatus.Connecting },
      { input: TruenasConnectStatus.RegistrationFinalizationFailed, expected: TncStatus.Failed },
      { input: TruenasConnectStatus.RegistrationFinalizationTimeout, expected: TncStatus.Failed },
      { input: TruenasConnectStatus.CertGenerationFailed, expected: TncStatus.Failed },
      { input: TruenasConnectStatus.CertConfigurationFailure, expected: TncStatus.Failed },
      { input: TruenasConnectStatus.CertRenewalFailure, expected: TncStatus.Failed },
      { input: TruenasConnectStatus.Disabled, expected: TncStatus.Disabled },
    ];

    statusMappings.forEach(({ input, expected }) => {
      config.update((conf) => ({ ...conf, status: input }));
      spectator.detectChanges();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const component = spectator.component as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      expect(component.status()).toBe(expected);
    });
  });

  it('should not auto-enable service when status is not DISABLED', () => {
    // Reset config to Configured status
    config.update((conf) => ({ ...conf, status: TruenasConnectStatus.Configured }));

    const service = spectator.inject(TruenasConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');

    // Call ngOnInit on existing component
    spectator.component.ngOnInit();

    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('should handle null config gracefully', () => {
    // Set config to null
    config.set(null);

    // Should not throw error when calling ngOnInit
    expect(() => spectator.component.ngOnInit()).not.toThrow();

    // The status computed property should return Disabled for null config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const component = spectator.component as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(component.status()).toBe(TncStatus.Disabled);

    // Should not call enableService when config is null
    const service = spectator.inject(TruenasConnectService);
    const enableSpy = jest.spyOn(service, 'enableService');
    spectator.component.ngOnInit();
    expect(enableSpy).not.toHaveBeenCalled();
  });

  it('should handle undefined status in config', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    config.update((conf) => ({ ...conf, status: undefined as any }));
    spectator.detectChanges();

    // Should default to Disabled status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const component = spectator.component as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(component.status()).toBe(TncStatus.Disabled);
  });

  it('should have proper change detection strategy', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const componentClass = TruenasConnectStatusModalComponent as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const metadata = componentClass.ɵcmp;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(metadata.onPush).toBe(true);
  });
});
