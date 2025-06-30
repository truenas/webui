import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { Spectator, byText } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { DefaultGatewayDialog } from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
    ]),
    mockProvider(MatDialogRef),
    mockProvider(ErrorHandlerService),
  ],
});

describe('DefaultGatewayDialogComponent', () => {
  let spectator: Spectator<DefaultGatewayDialog>;
  let loader: HarnessLoader;
  let api: ApiService;

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    spectator.detectChanges();
  });

  it('checks the header', () => {
    expect(spectator.query('h1')).toHaveText('Set Gateway and DNS');
    expect(spectator.query('p')).toHaveText('Editing interface will result in default gateway being removed, which may result in TrueNAS being inaccessible. You can provide new default gateway and DNS information now:');
    expect(byText('Current Default Gateway: 1.1.1.1')).toBeTruthy();
    expect(byText('Current DNS #1: 8.8.8.8')).toBeTruthy();
    expect(byText('Current DNS #2: 8.8.4.4')).toBeTruthy();
  });

  it('should pre-fill the input with current gateway and DNS', async () => {
    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    expect(await defaultGatewayInput.getValue()).toBe('1.1.1.1');

    const dns1Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #1' }));
    expect(await dns1Input.getValue()).toBe('8.8.8.8');

    const dns2Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #2' }));
    expect(await dns2Input.getValue()).toBe('8.8.4.4');
  });

  it('should close dialog and call WebSocket service on form submission', async () => {
    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValue('192.168.1.1');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.save_default_route', ['192.168.1.1']);
  });

  it('should save DNS entries to session storage when provided', async () => {
    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValue('192.168.1.1');

    const dns1Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #1' }));
    await dns1Input.setValue('9.9.9.9');

    const dns2Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #2' }));
    await dns2Input.setValue('1.1.1.1');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(sessionStorage.getItem('pending-dns1')).toBe('9.9.9.9');
    expect(sessionStorage.getItem('pending-dns2')).toBe('1.1.1.1');

    // Clean up
    sessionStorage.removeItem('pending-dns1');
    sessionStorage.removeItem('pending-dns2');
  });

  it('should handle error when saving default route fails', async () => {
    const error = new Error('Failed to save route');
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => error));

    const errorHandler = spectator.inject(ErrorHandlerService);
    const dialogRef = spectator.inject(MatDialogRef);

    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValue('192.168.1.1');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(errorHandler.showErrorModal).toHaveBeenCalledWith(error);
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog on successful submission', async () => {
    const dialogRef = spectator.inject(MatDialogRef);

    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValue('192.168.1.1');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should validate IP addresses correctly', async () => {
    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    const dns1Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #1' }));

    // Test invalid gateway IP
    await defaultGatewayInput.setValue('invalid.ip');
    const registerButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    expect(await registerButton.isDisabled()).toBe(true);

    // Test valid gateway IP
    await defaultGatewayInput.setValue('192.168.1.1');
    expect(await registerButton.isDisabled()).toBe(false);

    // Test invalid DNS IP
    await dns1Input.setValue('invalid.dns');
    expect(await registerButton.isDisabled()).toBe(true);

    // Test empty DNS (should be valid as it's optional)
    await dns1Input.setValue('');
    expect(await registerButton.isDisabled()).toBe(false);
  });

  it('should remove session storage items when DNS fields are empty', async () => {
    // Set initial values in session storage
    sessionStorage.setItem('pending-dns1', 'old.dns.1');
    sessionStorage.setItem('pending-dns2', 'old.dns.2');

    const defaultGatewayInput = await loader.getHarness(IxInputHarness.with({ label: 'New IPv4 Default Gateway' }));
    await defaultGatewayInput.setValue('192.168.1.1');

    const dns1Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #1' }));
    const dns2Input = await loader.getHarness(IxInputHarness.with({ label: 'DNS Server #2' }));

    // Clear DNS fields
    await dns1Input.setValue('');
    await dns2Input.setValue('');

    const registerGatewayButton = await loader.getHarness(MatButtonHarness.with({ text: 'Register' }));
    await registerGatewayButton.click();

    expect(sessionStorage.getItem('pending-dns1')).toBeNull();
    expect(sessionStorage.getItem('pending-dns2')).toBeNull();
  });
});
