import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { of, Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
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

  const tnConnectConfig = signal<TruenasConnectConfig | undefined>(
    { status: TruenasConnectStatus.Configured } as TruenasConnectConfig,
  );

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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
      ...ixFormTestingProviders(),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockProvider(TruenasConnectService, {
        config: tnConnectConfig,
      }),
    ],
  });

  beforeEach(() => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current webshare config and populates form on init', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.config');

    expect(await (await getCheckbox('search')).isChecked()).toBe(true);
    expect(await (await getSelect('passkey')).getDisplayText()).toBe('Enabled');
  });

  it('submits updated config when form is saved', async () => {
    await (await getCheckbox('search')).uncheck();
    await (await getSelect('passkey')).selectOption('Required');

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Required }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Service configuration saved');
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('submits updated config and closes the panel on successful save', async () => {
    await (await getCheckbox('search')).uncheck();

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Enabled }]);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('handles error when loading config fails', () => {
    const api = spectator.inject(ApiService);
    const formErrorHandler = spectator.inject(FormErrorHandlerService);
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('Failed to load config')));

    spectator.component.ngOnInit();

    expect(formErrorHandler.handleValidationErrors).toHaveBeenCalled();
  });

  it('handles error when saving config fails', () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return of(mockWebShareConfig);
      }
      return throwError(() => new Error('Validation error'));
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('saves config with search enabled when keeping it enabled', async () => {
    // Form already has search enabled from mock config
    expect(await (await getCheckbox('search')).isChecked()).toBe(true);

    spectator.component.submit();

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

    expect(await (await getCheckbox('search')).isChecked()).toBe(false);
    expect(await (await getSelect('passkey')).getDisplayText()).toBe('Disabled');
  });

  it('disables and clears the TrueSearch toggle when TrueNAS Connect is not configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();

    const searchCheckbox = await getCheckbox('search');
    expect(await searchCheckbox.isDisabled()).toBe(true);
    expect(await searchCheckbox.isChecked()).toBe(false);
  });

  it('does not submit TrueSearch as enabled when TrueNAS Connect is not configured', () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
      'webshare.update',
      [expect.objectContaining({ search: false })],
    );
  });

  it('does not restore search=true from an async config response while Connect is not configured', async () => {
    // Reproduce the production ordering: Connect is disabled and the async `webshare.config`
    // resolves AFTER the guard effect has already locked the control off.
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    const config$ = new Subject<WebShareConfig>();
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return config$;
      }
      return of(mockWebShareConfig);
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();

    // Backend reports stale search=true after the effect already disabled the control.
    config$.next({ id: 1, search: true, passkey: WebSharePasskey.Enabled });
    spectator.detectChanges();

    expect(await (await getCheckbox('search')).isChecked()).toBe(false);

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith(
      'webshare.update',
      [expect.objectContaining({ search: false })],
    );
  });

  it('re-enables the TrueSearch toggle when TrueNAS Connect becomes configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();
    expect(await (await getCheckbox('search')).isDisabled()).toBe(true);

    tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
    spectator.detectChanges();
    expect(await (await getCheckbox('search')).isDisabled()).toBe(false);
  });
});
