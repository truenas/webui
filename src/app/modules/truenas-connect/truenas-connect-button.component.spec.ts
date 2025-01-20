import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectStatusModalComponent } from 'app/modules/truenas-connect/components/truenas-connect-status-modal/truenas-connect-status-modal.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { TruenasConnectButtonComponent } from 'app/modules/truenas-connect/truenas-connect-button.component';

describe('TruenasConnectButtonComponent', () => {
  let spectator: Spectator<TruenasConnectButtonComponent>;
  let loader: HarnessLoader;
  const config = {
    enabled: true,
    ips: ['10.220.36.85'],
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
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should popup the TNC service status', async () => {
    const openSpy = jest.spyOn(spectator.inject(MatDialog), 'open');
    const statusBtn = await loader.getHarness(
      MatButtonHarness.with({ selector: '[ixTest="tnc-show-status"]' }),
    );
    await statusBtn.click();
    expect(openSpy).toHaveBeenCalledWith(TruenasConnectStatusModalComponent, {
      width: '400px',
      hasBackdrop: true,
      position: {
        top: '48px',
        right: '0px',
      },
    });
  });
});
