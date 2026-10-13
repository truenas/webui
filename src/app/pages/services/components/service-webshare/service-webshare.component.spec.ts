import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockEntitlements } from 'app/core/testing/utils/mock-entitlements.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey } from 'app/enums/webshare-passkey.enum';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceWebshareComponent } from './service-webshare.component';

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

  const getSearchCheckbox = (): Promise<IxCheckboxHarness> => loader.getHarness(
    IxCheckboxHarness.with({ label: 'Enable TrueSearch' }),
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
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockEntitlements(),
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Required, ...mcpDefaults }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Service configuration saved');
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({ response: true, error: null });
  });

  it('submits updated config and closes slide-in on successful save', async () => {
    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));
    await searchCheckbox.setValue(false);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('webshare.update', [{ search: false, passkey: WebSharePasskey.Enabled, ...mcpDefaults }]);
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

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [{ search: true, passkey: WebSharePasskey.Enabled, ...mcpDefaults }]);
  });

  it('initializes form with default values when config has search disabled', async () => {
    const api = spectator.inject(ApiService);
    jest.spyOn(api, 'call').mockImplementation((method) => {
      if (method === 'webshare.config') {
        return of({ ...mockWebShareConfig, search: false, passkey: WebSharePasskey.Disabled });
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

  it('disables and clears the TrueSearch toggle when TrueNAS Connect is not configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();

    const searchCheckbox = await getSearchCheckbox();
    expect(await searchCheckbox.isDisabled()).toBe(true);
    expect(await searchCheckbox.getValue()).toBe(false);
  });

  describe('MCP', () => {
    const getMcpCheckbox = (label: string): Promise<IxCheckboxHarness> => loader.getHarness(
      IxCheckboxHarness.with({ label }),
    );
    const getGroupsSelect = (): Promise<IxSelectHarness | null> => loader.getHarnessOrNull(
      IxSelectHarness.with({ label: 'Allowed Groups' }),
    );
    const save = async (): Promise<void> => {
      await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();
    };
    const reloadWithConfig = async (config: Partial<WebShareConfig>): Promise<void> => {
      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method) => {
        return of(method === 'webshare.config' ? { ...mockWebShareConfig, ...config } : mockWebShareConfig);
      });
      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();
    };

    it('hides the MCP group and write settings while MCP is disabled', async () => {
      expect(await (await getMcpCheckbox('Enable MCP')).getValue()).toBe(false);
      expect(await getGroupsSelect()).toBeNull();
      expect(await loader.getHarnessOrNull(IxCheckboxHarness.with({ label: 'Allow Write' }))).toBeNull();
    });

    it('prefills truenas_webshare and offers only groups that grant Webshare access when MCP is enabled', async () => {
      await (await getMcpCheckbox('Enable MCP')).setValue(true);

      const groupsSelect = await getGroupsSelect();
      expect(await groupsSelect!.getValue()).toEqual(['truenas_webshare']);
      expect(await groupsSelect!.getOptionLabels()).toEqual(['truenas_webshare', 'ad_staff']);
    });

    it('hides the group picker and submits truenas_webshare when there are no login groups', async () => {
      await reloadWithConfig({ groups: [] });
      await (await getMcpCheckbox('Enable MCP')).setValue(true);

      expect(await getGroupsSelect()).toBeNull();

      await save();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: true,
        mcp_allowed_groups: ['truenas_webshare'],
      })]);
    });

    it('submits MCP settings', async () => {
      await (await getMcpCheckbox('Enable MCP')).setValue(true);
      await (await getGroupsSelect())!.setValue(['truenas_webshare', 'ad_staff']);
      await (await getMcpCheckbox('Allow Write')).setValue(true);

      await save();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: true,
        mcp_allowed_groups: ['truenas_webshare', 'ad_staff'],
        mcp_allow_write: true,
      })]);
    });

    it('loads saved MCP settings without prefilling over them', async () => {
      await reloadWithConfig({ mcp_enabled: true, mcp_allowed_groups: ['ad_staff'], mcp_allow_write: true });

      expect(await (await getMcpCheckbox('Enable MCP')).getValue()).toBe(true);
      expect(await (await getGroupsSelect())!.getValue()).toEqual(['ad_staff']);
      expect(await (await getMcpCheckbox('Allow Write')).getValue()).toBe(true);
    });

    it('keeps saved MCP groups and write access when MCP is turned off', async () => {
      await reloadWithConfig({ mcp_enabled: true, mcp_allowed_groups: ['ad_staff'], mcp_allow_write: true });
      await (await getMcpCheckbox('Enable MCP')).setValue(false);

      await save();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('webshare.update', [expect.objectContaining({
        mcp_enabled: false,
        mcp_allowed_groups: ['ad_staff'],
        mcp_allow_write: true,
      })]);
    });

    it('does not allow saving MCP enabled without a group', async () => {
      await (await getMcpCheckbox('Enable MCP')).setValue(true);
      await (await getGroupsSelect())!.setValue([]);

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });
  });

  describe('when the system is not entitled to TRUESEARCH', () => {
    const createDenied = createComponentFactory({
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
          requireConfirmationWhen: jest.fn(),
        }),
        mockProvider(SnackbarService),
        mockProvider(FormErrorHandlerService),
        mockEntitlements([EntitlementFeature.TrueSearch]),
        mockProvider(TruenasConnectService, {
          config: tnConnectConfig,
        }),
      ],
    });

    it('locks the TrueSearch toggle even while TrueNAS Connect is configured', async () => {
      tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
      const deniedSpectator = createDenied();
      deniedSpectator.detectChanges();
      await deniedSpectator.fixture.whenStable();

      const deniedLoader = TestbedHarnessEnvironment.loader(deniedSpectator.fixture);
      const searchCheckbox = await deniedLoader.getHarness(IxCheckboxHarness.with({ label: 'Enable TrueSearch' }));

      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(await searchCheckbox.getValue()).toBe(false);
    });
  });

  it('does not submit TrueSearch as enabled when TrueNAS Connect is not configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

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
    config$.next({ ...mockWebShareConfig, search: true });
    spectator.detectChanges();

    expect(await (await getSearchCheckbox()).getValue()).toBe(false);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith(
      'webshare.update',
      [expect.objectContaining({ search: false })],
    );
  });

  it('re-enables the TrueSearch toggle when TrueNAS Connect becomes configured', async () => {
    tnConnectConfig.set({ status: TruenasConnectStatus.Disabled } as TruenasConnectConfig);
    spectator.detectChanges();
    expect(await (await getSearchCheckbox()).isDisabled()).toBe(true);

    tnConnectConfig.set({ status: TruenasConnectStatus.Configured } as TruenasConnectConfig);
    spectator.detectChanges();
    expect(await (await getSearchCheckbox()).isDisabled()).toBe(false);
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
