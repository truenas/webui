import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnDialogHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DefaultGatewayDialog } from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('DefaultGatewayDialogComponent', () => {
  let spectator: Spectator<DefaultGatewayDialog>;
  let loader: HarnessLoader;
  let api: ApiService;

  async function getInputValues(harnessLoader: HarnessLoader): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    for (const name of ['defaultGateway', 'dns1', 'dns2', 'dns3']) {
      const input = await harnessLoader.getHarness(TnInputHarness.with({ name }));

      result[name] = await input.getValue();
    }
    return result;
  }

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
    mockProvider(DialogRef),
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
      { provide: DIALOG_DATA, useValue: null },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows the correct dialog title', async () => {
    const dialog = await loader.getHarness(TnDialogHarness);
    expect(await dialog.getTitle()).toBe('Set Gateway and DNS');
  });

  it('pre-fills the form with current gateway and DNS values', async () => {
    const formValues = await getInputValues(loader);

    expect(formValues).toEqual({
      defaultGateway: '1.1.1.1',
      dns1: '8.8.8.8',
      dns2: '8.8.4.4',
      dns3: '',
    });
  });

  it('saves gateway and DNS configuration when form is submitted', async () => {
    const dialogRef = spectator.inject(DialogRef);
    const snackbar = spectator.inject(SnackbarService);

    const gatewayInput = await loader.getHarness(TnInputHarness.with({ name: 'defaultGateway' }));
    await gatewayInput.setValue('192.168.1.1');
    const dns1Input = await loader.getHarness(TnInputHarness.with({ name: 'dns1' }));
    await dns1Input.setValue('9.9.9.9');
    const dns2Input = await loader.getHarness(TnInputHarness.with({ name: 'dns2' }));
    await dns2Input.setValue('1.1.1.1');

    const registerButton = await loader.getHarness(TnButtonHarness.with({ label: 'Register' }));
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

    const createComponentWithData = createComponentFactory({
      component: DefaultGatewayDialog,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        ...defaultProviders,
        {
          provide: DIALOG_DATA,
          useValue: {
            ipv4gateway: '10.0.0.1',
            nameserver1: '1.1.1.1',
            nameserver2: '1.0.0.1',
            nameserver3: '208.67.222.222',
          },
        },
      ],
    });

    beforeEach(() => {
      spectatorWithData = createComponentWithData();
      loaderWithData = TestbedHarnessEnvironment.loader(spectatorWithData.fixture);
    });

    it('pre-fills form with values from passed data', async () => {
      const formValues = await getInputValues(loaderWithData);

      expect(formValues).toEqual({
        defaultGateway: '10.0.0.1',
        dns1: '1.1.1.1',
        dns2: '1.0.0.1',
        dns3: '208.67.222.222',
      });
    });
  });
});
