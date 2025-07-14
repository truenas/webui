import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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

  const defaultProviders = [
    mockAuth(),
    mockApi([
      mockCall('network.general.summary', {
        default_routes: ['1.1.1.1'],
        nameservers: ['8.8.8.8', '8.8.4.4'],
      } as NetworkSummary),
      mockCall('interface.save_default_route'),
      mockCall('interface.save_network_config'),
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
  ];

  const createComponent = createComponentFactory({
    component: DefaultGatewayDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      ...defaultProviders,
      { provide: MAT_DIALOG_DATA, useValue: null },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows the correct dialog title', () => {
    expect(spectator.query('h1')).toHaveText('Set Gateway and DNS');
  });

  it('pre-fills the form with current gateway and DNS values', async () => {
    const formValues = await form.getValues();

    expect(formValues).toEqual({
      'New IPv4 Default Gateway': '1.1.1.1',
      'Primary DNS Server': '8.8.8.8',
      'Secondary DNS Server': '8.8.4.4',
      'Tertiary DNS Server': '',
    });
  });

  it('saves gateway and DNS configuration when form is submitted', async () => {
    const dialogRef = spectator.inject(MatDialogRef);
    const snackbar = spectator.inject(SnackbarService);

    await form.fillForm({
      'New IPv4 Default Gateway': '192.168.1.1',
      'Primary DNS Server': '9.9.9.9',
      'Secondary DNS Server': '1.1.1.1',
    });

    const registerButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
    expect(api.call).toHaveBeenCalledWith('interface.save_network_config', [{
      ipv4gateway: '192.168.1.1',
      nameserver1: '9.9.9.9',
      nameserver2: '1.1.1.1',
    }]);
    expect(snackbar.success).toHaveBeenCalledWith('Network configuration updated successfully');
  });

  describe('when opened with data from interface form', () => {
    let spectatorWithData: Spectator<DefaultGatewayDialog>;
    let loaderWithData: HarnessLoader;
    let formWithData: IxFormHarness;

    const createComponentWithData = createComponentFactory({
      component: DefaultGatewayDialog,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        ...defaultProviders,
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            ipv4gateway: '10.0.0.1',
            nameserver1: '1.1.1.1',
            nameserver2: '1.0.0.1',
            nameserver3: '208.67.222.222',
          },
        },
      ],
    });

    beforeEach(async () => {
      spectatorWithData = createComponentWithData();
      loaderWithData = TestbedHarnessEnvironment.loader(spectatorWithData.fixture);
      formWithData = await loaderWithData.getHarness(IxFormHarness);
    });

    it('pre-fills form with values from passed data', async () => {
      const formValues = await formWithData.getValues();

      expect(formValues).toEqual({
        'New IPv4 Default Gateway': '10.0.0.1',
        'Primary DNS Server': '1.1.1.1',
        'Secondary DNS Server': '1.0.0.1',
        'Tertiary DNS Server': '208.67.222.222',
      });
    });
  });
});
