import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import {
  Spectator,
  createComponentFactory,
  mockProvider,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { TruenasConnectModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-modal/truenas-connect-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

describe('TruenasConnectModalComponent', () => {
  let spectator: Spectator<TruenasConnectModalComponent>;
  let loader: HarnessLoader;
  const config = {
    enabled: true,
    ips: ['10.220.36.85'],
    tnc_base_url: 'https://truenas.connect.dev.ixsystems.net/',
    account_service_base_url: 'https://account-service.dev.ixsystems.net/',
    leca_service_base_url: 'https://leca-server.dev.ixsystems.net/',
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig;
  const configSignal = signal(config);
  const createComponent = createComponentFactory({
    component: TruenasConnectModalComponent,
    providers: [
      mockProvider(MatDialogRef, {
        close: jest.fn(),
      }),
      mockProvider(TruenasConnectService, {
        config: configSignal,
        enableService: () => of(),
        disableService: () => of(),
        connect: () => of(),
        generateToken: () => of(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should disable the service', async () => {
    const disableSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'disableService');
    const disableBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Disable Service',
      }),
    );
    await disableBtn.click();
    expect(disableSpy).toHaveBeenCalled();
  });

  it('should enable the service', async () => {
    configSignal.set({
      ...config,
      status: TruenasConnectStatus.Disabled,
    });
    const enableSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'enableService');
    const enableBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Enable Service',
      }),
    );
    await enableBtn.click();
    expect(enableSpy).toHaveBeenCalledWith({
      enabled: config.enabled,
      ips: config.ips,
      tnc_base_url: config.tnc_base_url,
      account_service_base_url: config.account_service_base_url,
      leca_service_base_url: config.leca_service_base_url,
    });
  });

  it('should generate a tokken', async () => {
    configSignal.set({
      ...config,
      status: TruenasConnectStatus.ClaimTokenMissing,
    });
    const generateSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'generateToken');
    const generateBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Generate Token',
      }),
    );
    await generateBtn.click();
    expect(generateSpy).toHaveBeenCalled();
  });

  it('should save the form', async () => {
    const tncInput = await loader.getHarness(
      IxInputHarness.with({
        label: 'TNC Base Url',
      }),
    );
    const saveBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Save',
      }),
    );
    const enableService = jest.spyOn(spectator.inject(TruenasConnectService), 'enableService');
    const tncUrl = 'http://tnc-test.com';
    await tncInput.setValue(tncUrl);
    await saveBtn.click();
    expect(enableService).toHaveBeenCalledWith({
      enabled: config.enabled,
      ips: config.ips,
      tnc_base_url: tncUrl,
      account_service_base_url: config.account_service_base_url,
      leca_service_base_url: config.leca_service_base_url,
    });
  });

  it('should connect to TNC', async () => {
    configSignal.set({
      ...config,
      status: TruenasConnectStatus.RegistrationFinalizationWaiting,
    });
    const connectBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Connect',
      }),
    );
    const connectSpy = jest.spyOn(spectator.inject(TruenasConnectService), 'connect');
    await connectBtn.click();
    expect(connectSpy).toHaveBeenCalled();
  });

  it('should close the dialog', async () => {
    const cancelBtn = await loader.getHarness(
      MatButtonHarness.with({
        text: 'Cancel',
      }),
    );
    const closeSpy = jest.spyOn(spectator.inject(MatDialogRef), 'close');
    await cancelBtn.click();
    expect(closeSpy).toHaveBeenCalled();
  });
});
