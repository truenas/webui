import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { TruenasConnectButtonComponent } from 'app/modules/truenas-connect/truenas-connect-button.component';

describe('TruenasConnectButtonComponent', () => {
  let spectator: Spectator<TruenasConnectButtonComponent>;
  let loader: HarnessLoader;
  const config = {
    enabled: true,
    ips: ['10.220.36.85'],
    interfaces_ips: [],
    tnc_base_url: 'https://truenas.connect.dev.ixsystems.net/',
    account_service_base_url: 'https://account-service.dev.ixsystems.net/',
    leca_service_base_url: 'https://leca-server.dev.ixsystems.net/',
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig;
  const createComponent = createComponentFactory({
    component: TruenasConnectButtonComponent,
    providers: [
      mockProvider(TruenasConnectService, {
        config: signal(config),
        openStatusModal: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
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
});
