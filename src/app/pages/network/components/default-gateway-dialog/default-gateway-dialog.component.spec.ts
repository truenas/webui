import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Spectator, byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DefaultGatewayDialogComponent } from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';

describe('DefaultGatewayDialogComponent', () => {
  let spectator: Spectator<DefaultGatewayDialogComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const createComponent = createComponentFactory({
    component: DefaultGatewayDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('network.general.summary', {
          default_routes: ['1.1.1.1'],
        } as NetworkSummary),
        mockCall('interface.save_default_route'),
      ]),
      mockProvider(MatDialogRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('checks the header', () => {
    expect(spectator.query('h1')).toHaveText('Register Default Gateway');
    expect(spectator.query('p')).toHaveText('Editing interface will result in default gateway being removed, which may result in TrueNAS being inaccessible. You can provide new default gateway now:');
    expect(byText('Current Default Gateway: 1.1.1.1')).toBeTruthy();
  });

  it('should close dialog and call WebSocket service on form submission', async () => {
    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValueAndTriggerBlur('192.168.1.1');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.save_default_route', ['192.168.1.1']);
  });
});
