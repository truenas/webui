import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DefaultGatewayDialog } from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DefaultGatewayDialogComponent', () => {
  let spectator: Spectator<DefaultGatewayDialog>;
  let loader: HarnessLoader;
  let api: ApiService;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: DefaultGatewayDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('network.general.summary', {
          default_routes: ['1.1.1.1'],
          nameservers: ['8.8.8.8', '8.8.4.4'],
        } as NetworkSummary),
        mockCall('interface.save_default_route'),
        mockCall('network.configuration.update'),
      ]),
      mockProvider(MatDialogRef),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: () => (source$: unknown) => source$,
      }),
      mockProvider(SnackbarService),
      mockProvider(LoaderService, {
        withLoader: () => (source$: unknown) => source$,
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows current gateway and DNS values in the header', () => {
    expect(spectator.query('h1')).toHaveText('Set Gateway and DNS');

    const listItems = spectator.queryAll('.list-item');
    expect(listItems[0]).toHaveText('Current Default Gateway: 1.1.1.1');
    expect(listItems[1]).toHaveText('Current DNS #1: 8.8.8.8');
    expect(listItems[2]).toHaveText('Current DNS #2: 8.8.4.4');
  });

  it('pre-fills the form with current gateway and DNS values', async () => {
    const formValues = await form.getValues();

    expect(formValues).toEqual({
      'New IPv4 Default Gateway': '1.1.1.1',
      'DNS Server #1': '8.8.8.8',
      'DNS Server #2': '8.8.4.4',
    });
  });

  it('saves gateway and DNS configuration when form is submitted', async () => {
    const dialogRef = spectator.inject(MatDialogRef);
    const snackbar = spectator.inject(SnackbarService);

    await form.fillForm({
      'New IPv4 Default Gateway': '192.168.1.1',
      'DNS Server #1': '9.9.9.9',
      'DNS Server #2': '1.1.1.1',
    });

    const registerButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
    expect(api.call).toHaveBeenCalledWith('interface.save_default_route', ['192.168.1.1']);
    expect(api.call).toHaveBeenCalledWith('network.configuration.update', [{
      nameserver1: '9.9.9.9',
      nameserver2: '1.1.1.1',
    }]);
    expect(snackbar.success).toHaveBeenCalledWith('DNS settings updated successfully');
  });
});
