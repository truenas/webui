import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceWebshareComponent } from './service-webshare.component';

describe('ServiceWebshareComponent', () => {
  let spectator: Spectator<ServiceWebshareComponent>;
  let loader: HarnessLoader;

  const mockWebShareConfig: WebShareConfig = {
    id: 1,
    search: true,
    passkey: WebSharePasskey.Enabled,
  };

  const createComponent = createComponentFactory({
    component: ServiceWebshareComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('webshare.config', mockWebShareConfig),
        mockCall('webshare.update', mockWebShareConfig),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current webshare config and populates form on init', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.config');

    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    expect(await searchCheckbox.getValue()).toBe(true);

    const passkeySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Passkey' }));
    expect(await passkeySelect.getValue()).toBe('Enabled');
  });

  it('submits updated config when form is saved', async () => {
    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    await searchCheckbox.setValue(false);

    const passkeySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Passkey' }));
    await passkeySelect.setValue('Required');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Required }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Service configuration saved');
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });

  it('submits updated config and closes slide-in on successful save', async () => {
    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    await searchCheckbox.setValue(false);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Enabled }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });

  it('handles error when loading config fails', () => {
    const api = spectator.inject(ApiService);
    const formErrorHandler = spectator.inject(FormErrorHandlerService);
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('Failed to load config')));

    spectator.component.ngOnInit();

    expect(formErrorHandler.handleValidationErrors).toHaveBeenCalled();
  });

  it('handles error when saving config fails', async () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return of(mockWebShareConfig);
      }
      return throwError(() => new Error('Validation error'));
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(SlideInRef).close).not.toHaveBeenCalled();
  });

  it('saves config with search enabled when keeping it enabled', async () => {
    // Form already has search enabled from mock config
    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    expect(await searchCheckbox.getValue()).toBe(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: true, passkey: WebSharePasskey.Enabled }]);
  });

  it('initializes form with default values when config has search disabled', async () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return of({ id: 1, search: false, passkey: WebSharePasskey.Disabled } as WebShareConfig);
      }
      return of(null);
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    expect(await searchCheckbox.getValue()).toBe(false);

    const passkeySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Passkey' }));
    expect(await passkeySelect.getValue()).toBe('Disabled');
  });

  it('displays the form with correct title', () => {
    const header = spectator.query('ix-modal-header');
    expect(header).toBeTruthy();
  });

  it('has save button accessible', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(saveButton).toBeTruthy();
  });
});
