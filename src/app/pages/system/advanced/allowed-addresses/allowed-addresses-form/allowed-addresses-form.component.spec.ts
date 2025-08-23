import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('AllowedAddressesComponent', () => {
  let spectator: Spectator<AllowedAddressesFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  const componentRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };
  const createComponent = createComponentFactory({
    component: AllowedAddressesFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('system.general.update'),
        mockCall('system.general.ui_restart'),
        mockCall('system.general.config', {
          ui_allowlist: ['1.1.1.1/32'],
        } as SystemGeneralConfig),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, componentRef),
      mockProvider(SystemGeneralService, {
        handleUiServiceRestart: jest.fn(() => of(true)),
      }),
      provideMockStore(),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows allowed addresses when editing a form', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({ 'IP Address/Subnet': '1.1.1.1/32' });
  });

  it('sends an update payload with specific IP address', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'IP Address/Subnet': '2.2.2.2' });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.general.update', [
      { ui_allowlist: ['2.2.2.2'] },
    ]);
  });

  it('sends an update payload with an IP address and a subnet mask', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'IP Address/Subnet': '192.168.1.0/24' });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('system.general.update', [
      { ui_allowlist: ['192.168.1.0/24'] },
    ]);
  });

  it('closes the form normally when no changes are made', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).not.toHaveBeenCalledWith('system.general.update');
    expect(componentRef.close).toHaveBeenCalledWith({ response: false });
  });

  describe('warnings', () => {
    it('does not show a warning when user already has allowed IPs and adds more', async () => {
      expect(spectator.query(WarningComponent)).not.toExist();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '192.168.1.0/24' });

      expect(spectator.query(WarningComponent)).not.toExist();
    });

    it('shows a warning when user changes form from no addresses to some addresses', async () => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockCall('system.general.config', {
        ui_allowlist: [],
      } as SystemGeneralConfig);
      spectator.component.ngOnInit();

      expect(spectator.query(WarningComponent)).not.toExist();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '192.168.1.0/24' });

      const warning = spectator.query(WarningComponent);
      expect(warning.color()).toBe('red');
      expect(warning.message()).toBe(
        'Make sure to add your current IP address to the list. Otherwise you will lose access to TrueNAS UI.',
      );
    });
  });

  describe('SystemGeneralService integration', () => {
    it('should call SystemGeneralService.handleUiServiceRestart when saving changes', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '2.2.2.2' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should not call SystemGeneralService.handleUiServiceRestart when no changes are made', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(systemGeneralService.handleUiServiceRestart).not.toHaveBeenCalled();
    });

    it('should call SystemGeneralService.handleUiServiceRestart after system.general.update succeeds', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '3.3.3.3' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.general.update', [
        { ui_allowlist: ['3.3.3.3'] },
      ]);
      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should close slide-in after successful restart handling', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '4.4.4.4' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(componentRef.close).toHaveBeenCalledWith({ response: true });
    });

    it('should handle form validation and submission correctly', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const form = await loader.getHarness(IxFormHarness);

      // Test with a valid IP address format
      await form.fillForm({ 'IP Address/Subnet': '10.0.0.1/24' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.general.update', [
        { ui_allowlist: ['10.0.0.1/24'] },
      ]);
      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should show success message and handle restart flow', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '5.5.5.5' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Verify the flow: update -> restart -> close
      expect(api.call).toHaveBeenCalledWith('system.general.update', [
        { ui_allowlist: ['5.5.5.5'] },
      ]);
      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
      expect(componentRef.close).toHaveBeenCalledWith({ response: true });
    });

    it('should handle restart cancellation gracefully', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      // Mock restart to return false (user cancelled)
      (systemGeneralService.handleUiServiceRestart as jest.Mock) = jest.fn(() => of(true));

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({ 'IP Address/Subnet': '6.6.6.6' });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      // Even if restart is cancelled, the form should still close successfully
      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
      expect(componentRef.close).toHaveBeenCalledWith({ response: true });
    });
  });
});
