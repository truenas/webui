import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnCheckboxHarness, TnSelectHarness } from '@truenas/ui-components';
import { of, Subject } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntitlements } from 'app/core/testing/utils/mock-entitlements.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServiceWebshareComponent } from './service-webshare.component';

type WebShareConfig = CallResponse<WebUiApiDirectory, 'webshare.config'>;

describe('ServiceWebshareComponent', () => {
  let spectator: Spectator<ServiceWebshareComponent>;
  let loader: HarnessLoader;

  const mockWebShareConfig = {
    id: 1,
    search: true,
    passkey: WebSharePasskey.Enabled,
    groups: ['ad_staff'],
    mcp_enabled: false,
    mcp_allowed_groups: [],
    mcp_allow_write: false,
  } as WebShareConfig;

  const mcpDefaults = { mcp_enabled: false, mcp_allowed_groups: [] as string[], mcp_allow_write: false };

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
      mockTypedApi([
        mockTypedCall('webshare.config', mockWebShareConfig),
        mockTypedCall('webshare.update', mockWebShareConfig),
      ]),
      ...ixFormTestingProviders(),
      mockProvider(ErrorHandlerService),
      mockProvider(TruenasConnectService, {
        config: tnConnectConfig,
      }),
      mockEntitlements(),
    ],
  });

  /**
   * A second instance, for tests that need a different `webshare.config` response than the one
   * `beforeEach` loaded. Always a fresh component rather than a second `ngOnInit()` on the shared
   * one: re-initialising re-registers the form's valueChanges subscriptions on top of the guard
   * effect already wired in the constructor, so the result would hinge on double-init being
   * harmless. Repoints `loader` at the new fixture so `getCheckbox`/`getSelect` address it.
   */
  const createSecondFixture = (): ComponentFixture<ServiceWebshareComponent> => {
    const fixture = TestBed.createComponent(ServiceWebshareComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current webshare config and populates form on init', async () => {
    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.config');

    expect(await (await getCheckbox('search')).isChecked()).toBe(true);
    expect(await (await getSelect('passkey')).getDisplayText()).toBe('Enabled');
  });

  it('submits updated config when form is saved', async () => {
    await (await getCheckbox('search')).uncheck();
    await (await getSelect('passkey')).selectOption('Required');

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Required, ...mcpDefaults }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Service configuration saved');
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  it('submits updated config and closes the panel on successful save', async () => {
    await (await getCheckbox('search')).uncheck();

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(TypedApiService).call).toHaveBeenLastCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Enabled, ...mcpDefaults }]);
    expect(closeSpy).toHaveBeenCalledWith(true);
  });

  // The host reads both: `isBusy()` drives the panel's progress bar, `isSubmitting()` flips its Save
  // to "Saving…". A slow config load must trip only the former, or Save reads as saving on open.
  it('reports isBusy() but not isSubmitting() while the config loads, and both while saving', () => {
    const config$ = new Subject<WebShareConfig>();
    const update$ = new Subject<WebShareConfig>();
    jest.spyOn(spectator.inject(TypedApiService), 'call').mockImplementation((method) => {
      return method === 'webshare.config' ? config$ : update$;
    });

    const fixture = createSecondFixture();
    const component = fixture.componentInstance;

    expect(component.isBusy()).toBe(true);
    expect(component.isSubmitting()).toBe(false);

    config$.next(mockWebShareConfig);
    fixture.detectChanges();

    expect(component.isBusy()).toBe(false);
    expect(component.isSubmitting()).toBe(false);

    component.submit();

    expect(component.isBusy()).toBe(true);
    expect(component.isSubmitting()).toBe(true);

    update$.next(mockWebShareConfig);
    update$.complete();

    expect(component.isBusy()).toBe(false);
    expect(component.isSubmitting()).toBe(false);
  });

  it('handles error when loading config fails', async () => {
    const errorHandler = spectator.inject(ErrorHandlerService);
    spectator.inject(MockTypedApiService).mockCallError('webshare.config');

    const failed = createSecondFixture();
    await failed.whenStable();

    expect(errorHandler.showErrorModal).toHaveBeenCalled();
    // `hasLoadFailed` is what the panel reads (for its banner) and what `<ix-form>`'s
    // extraDisabled is bound to; that binding blocking Save is covered in the ix-form spec.
    expect(failed.componentInstance.hasLoadFailed()).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
  });

  it('handles error when saving config fails', async () => {
    // The component from `beforeEach` already loaded its config; only the save needs to fail.
    spectator.inject(MockTypedApiService).mockCallError('webshare.update');

    const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
    spectator.component.submit();
    await spectator.fixture.whenStable();

    // Assert the failure actually reached the error handler — `closed` not firing alone would
    // also hold if the submit never ran at all.
    expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalled();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('saves config with search enabled when keeping it enabled', async () => {
    // Form already has search enabled from mock config
    expect(await (await getCheckbox('search')).isChecked()).toBe(true);

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: true, passkey: WebSharePasskey.Enabled, ...mcpDefaults }]);
  });

  it('initializes form with default values when config has search disabled', async () => {
    jest.spyOn(spectator.inject(TypedApiService), 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return of({ ...mockWebShareConfig, search: false, passkey: WebSharePasskey.Disabled });
      }
      return of(null);
    });

    const fixture = createSecondFixture();
    await fixture.whenStable();

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

  describe('MCP', () => {
    const mockConfig = (config: Partial<WebShareConfig>): void => {
      jest.spyOn(spectator.inject(TypedApiService), 'call').mockImplementation((method) => {
        return of(method === 'webshare.config' ? { ...mockWebShareConfig, ...config } : mockWebShareConfig);
      });
    };

    it('hides the MCP group and write settings while MCP is disabled', async () => {
      expect(await (await getCheckbox('mcp_enabled')).isChecked()).toBe(false);
      expect(await loader.getHarnessOrNull(
        TnSelectHarness.with({ selector: '[formControlName="mcp_allowed_groups"]' }),
      )).toBeNull();
      expect(await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="mcp_allow_write"]' }),
      )).toBeNull();
    });

    it('prefills truenas_webshare and offers only groups that grant Webshare access when MCP is enabled', async () => {
      await (await getCheckbox('mcp_enabled')).check();

      const groupsSelect = await getSelect('mcp_allowed_groups');
      expect(await groupsSelect.getDisplayText()).toBe('truenas_webshare');
      expect(await groupsSelect.getOptions()).toEqual(['truenas_webshare', 'ad_staff']);
    });

    it('hides the group picker and submits truenas_webshare when there are no login groups', async () => {
      mockConfig({ groups: [] });

      const fixture = createSecondFixture();
      await fixture.whenStable();
      await (await getCheckbox('mcp_enabled')).check();

      expect(await loader.getHarnessOrNull(
        TnSelectHarness.with({ selector: '[formControlName="mcp_allowed_groups"]' }),
      )).toBeNull();

      fixture.componentInstance.submit();
      await fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: true,
        mcp_allowed_groups: ['truenas_webshare'],
      })]);
    });

    it('submits MCP settings', async () => {
      await (await getCheckbox('mcp_enabled')).check();
      await (await getSelect('mcp_allowed_groups')).selectOption('ad_staff');
      await (await getCheckbox('mcp_allow_write')).check();

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: true,
        mcp_allowed_groups: ['truenas_webshare', 'ad_staff'],
        mcp_allow_write: true,
      })]);
    });

    it('loads saved MCP settings without prefilling over them', async () => {
      mockConfig({ mcp_enabled: true, mcp_allowed_groups: ['ad_staff'], mcp_allow_write: true });

      const fixture = createSecondFixture();
      await fixture.whenStable();

      expect(await (await getCheckbox('mcp_enabled')).isChecked()).toBe(true);
      expect(await (await getSelect('mcp_allowed_groups')).getDisplayText()).toBe('ad_staff');
      expect(await (await getCheckbox('mcp_allow_write')).isChecked()).toBe(true);
    });

    it('keeps saved MCP groups and write access when MCP is turned off', async () => {
      mockConfig({ mcp_enabled: true, mcp_allowed_groups: ['ad_staff'], mcp_allow_write: true });

      const fixture = createSecondFixture();
      await fixture.whenStable();
      await (await getCheckbox('mcp_enabled')).uncheck();

      fixture.componentInstance.submit();
      await fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: false,
        mcp_allowed_groups: ['ad_staff'],
        mcp_allow_write: true,
      })]);
    });

    it('does not allow saving MCP enabled without a group', async () => {
      await (await getCheckbox('mcp_enabled')).check();
      // Toggles the prefilled group back off, leaving none selected.
      await (await getSelect('mcp_allowed_groups')).selectOption('truenas_webshare');

      expect(spectator.component.canSubmit()).toBe(false);
    });
  });

  describe('when the system is not entitled to TRUESEARCH', () => {
    const createDenied = createComponentFactory({
      component: ServiceWebshareComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockAuth(),
        mockTypedApi([
          mockTypedCall('webshare.config', mockWebShareConfig),
          mockTypedCall('webshare.update', mockWebShareConfig),
        ]),
        ...ixFormTestingProviders(),
        mockProvider(ErrorHandlerService),
        mockProvider(TruenasConnectService, { config: tnConnectConfig }),
        mockEntitlements([EntitlementFeature.TrueSearch]),
      ],
    });

    it('locks the TrueSearch toggle even while TrueNAS Connect is configured', async () => {
      tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
      const deniedSpectator = createDenied();
      deniedSpectator.detectChanges();
      await deniedSpectator.fixture.whenStable();

      const deniedLoader = TestbedHarnessEnvironment.loader(deniedSpectator.fixture);
      const searchCheckbox = await deniedLoader.getHarness(
        TnCheckboxHarness.with({ selector: '[formControlName="search"]' }),
      );

      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(await searchCheckbox.isChecked()).toBe(false);
    });
  });

  it('does not submit TrueSearch as enabled when TrueNAS Connect is not configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
      'webshare.update',
      [expect.objectContaining({ search: false })],
    );
  });

  it('does not restore search=true from an async config response while Connect is not configured', async () => {
    // Reproduce the production ordering: Connect is disabled and the async `webshare.config`
    // resolves AFTER the guard effect has already locked the control off.
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    const config$ = new Subject<WebShareConfig>();
    const api = spectator.inject(TypedApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return config$;
      }
      return of(mockWebShareConfig);
    });

    const fixture = createSecondFixture();

    // Backend reports stale search=true after the effect already disabled the control.
    config$.next({ ...mockWebShareConfig, search: true });
    fixture.detectChanges();

    expect(await (await getCheckbox('search')).isChecked()).toBe(false);

    fixture.componentInstance.submit();

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

  describe('when entitlements resolve after webshare.config', () => {
    const isEntitled = signal<boolean | undefined>(undefined);
    const entitled$ = new Subject<boolean>();

    const createLateComponent = createComponentFactory({
      component: ServiceWebshareComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockAuth(),
        mockTypedApi([
          mockTypedCall('webshare.config', mockWebShareConfig),
          mockTypedCall('webshare.update', mockWebShareConfig),
        ]),
        ...ixFormTestingProviders(),
        mockProvider(ErrorHandlerService),
        mockProvider(TruenasConnectService, { config: tnConnectConfig }),
        mockProvider(EntitlementsService, {
          entitled: () => isEntitled,
          entitled$: () => entitled$,
        }),
      ],
    });

    beforeEach(() => {
      isEntitled.set(undefined);
      tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
      spectator = createLateComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('keeps a server-enabled TrueSearch instead of patching it off before the entitlement is known', async () => {
      // `webshare.config` has already answered (synchronously above); the entitlement lands now.
      entitled$.next(true);
      isEntitled.set(true);
      spectator.detectChanges();

      const checkbox = await getCheckbox('search');
      expect(await checkbox.isDisabled()).toBe(false);
      expect(await checkbox.isChecked()).toBe(true);

      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith(
        'webshare.update',
        [expect.objectContaining({ search: true })],
      );
    });
  });
});
