import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
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
  // `form` is protected on the IxFormHostForm base — reaching it keeps the failed-load test's
  // assertion about `loadFailed` rather than about an invalid form.
  const formOf = (component: ServiceWebshareComponent): FormGroup => {
    return (component as unknown as { form: FormGroup }).form;
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
      ...ixFormTestingProviders(),
      mockProvider(ErrorHandlerService),
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

  // The host reads both: `isBusy()` drives the panel's progress bar, `isSubmitting()` flips its Save
  // to "Saving…". A slow config load must trip only the former, or Save reads as saving on open.
  it('reports isBusy() but not isSubmitting() while the config loads, and both while saving', () => {
    const config$ = new Subject<WebShareConfig>();
    const update$ = new Subject<WebShareConfig>();
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      return method === 'webshare.config' ? config$ : update$;
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();

    expect(spectator.component.isBusy()).toBe(true);
    expect(spectator.component.isSubmitting()).toBe(false);

    config$.next(mockWebShareConfig);
    spectator.detectChanges();

    expect(spectator.component.isBusy()).toBe(false);
    expect(spectator.component.isSubmitting()).toBe(false);

    spectator.component.submit();

    expect(spectator.component.isBusy()).toBe(true);
    expect(spectator.component.isSubmitting()).toBe(true);

    update$.next(mockWebShareConfig);
    update$.complete();

    expect(spectator.component.isBusy()).toBe(false);
    expect(spectator.component.isSubmitting()).toBe(false);
  });

  it('handles error when loading config fails', () => {
    const api = spectator.inject(ApiService);
    const errorHandler = spectator.inject(ErrorHandlerService);
    jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('Failed to load config')));

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising an already-initialised form re-registers its valueChanges subscriptions,
    // so the assertion would hinge on double-init being harmless.
    const failed = TestBed.createComponent(ServiceWebshareComponent);
    failed.detectChanges();

    expect(errorHandler.showErrorModal).toHaveBeenCalled();
    // The form is left on defaults the user never saw — valid, but Save must stay blocked.
    expect(formOf(failed.componentInstance).valid).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
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

    // Assert the failure actually reached the error handler — `closed` not firing alone would
    // also hold if the submit never ran at all.
    expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalled();
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
