import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { CallResponse } from '@truenas/api-client';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnChipInputHarness, TnFormListHarness, TnInputHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { SmbEncryption } from 'app/enums/smb-encryption.enum';
import { SmbMinProtocol } from 'app/enums/smb-min-protocol.enum';
import { smbSearchSpotlight } from 'app/interfaces/smb-config.interface';
import { SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { WebUiApiDirectory, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UserService } from 'app/services/user.service';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

type SmbConfigEntry = CallResponse<WebUiApiDirectory, 'smb.config'>;

const smbConfig = {
  id: 1,
  netbiosname: 'truenas',
  workgroup: 'WORKGROUP',
  description: 'TrueNAS Server',
  unixcharset: 'UTF-8',
  debug: true,
  syslog: false,
  aapl_extensions: false,
  localmaster: true,
  guest: 'nobody',
  filemask: '',
  dirmask: '',
  bindip: [] as string[],
  ntlmv1_auth: false,
  minimum_protocol: SmbMinProtocol.Smb2,
  admin_group: null,
  encryption: SmbEncryption.Negotiate,
  search_protocols: [smbSearchSpotlight],
  stateful_failover: false,
} as SmbConfigEntry;

describe('ServiceSmbComponent', () => {
  let spectator: Spectator<ServiceSmbComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;
  let store$: MockStore;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  // The Advanced/Basic toggle is rendered by the side-panel host from `footerActions`.
  const toggleAdvancedSettings = (): void => {
    const [toggleAdvanced] = spectator.component.footerActions;
    toggleAdvanced.onClick();
    spectator.detectChanges();
  };

  const createComponent = createComponentFactory({
    component: ServiceSmbComponent,
    imports: [
      ReactiveFormsModule,
      TranslateModule.forRoot(),
    ],
    providers: [
      mockAuth(),
      mockTypedApi([
        mockTypedCall('smb.config', smbConfig),
        mockTypedQuery('sharing.smb.query', []),
        mockTypedCall('smb.unixcharset_choices', {
          'UTF-8': 'UTF-8',
          UTF_16: 'UTF_16',
        }),
        mockTypedCall('smb.bindip_choices', {
          '1.1.1.1': '1.1.1.1',
          '2.2.2.2': '2.2.2.2',
        }),
        mockTypedCall('smb.update', smbConfig),
        mockTypedCall('failover.licensed', false),
        mockTypedQuery(
          'user.query',
          [
            { id: 41, username: 'dummy-user' },
            { id: 42, username: 'second-user' },
          ] as WebUiQueryEntity<'user.query'>[],
        ),
      ]),
      ...ixFormTestingProviders(),
      mockProvider(DialogService),
      mockProvider(SystemGeneralService),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([{
          group: 'test-group',
        }])),
        userQueryDsCache: jest.fn(() => of([{
          username: 'test-username',
        }])),
        getUserByName: (username: string) => of({ username } as User),
        getGroupByName: (groupName: string) => of({ group: groupName }),
        getUserByNameCached: (username: string) => of({ username } as User),
        getGroupByNameCached: (groupName: string) => of({ group: groupName }),
      }),
      provideMockStore({
        selectors: [
          // Loaded map with no gated keys, i.e. entitled to everything.
          { selector: selectEntitlements, value: {} },
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(TypedApiService);
    store$ = spectator.inject(MockStore);
  });

  it('blocks Save when the initial config load fails', async () => {
    expect(spectator.component.canSubmit()).toBe(true);

    const showErrorModal = jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal')
      .mockReturnValue(of(true));
    spectator.inject(MockTypedApiService).mockCallError('smb.config');

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising would re-register the valueChanges subscriptions and async validators and
    // re-push this form's `bindip` rows, so the assertion would hinge on that being harmless.
    const failed = TestBed.createComponent(ServiceSmbComponent);
    failed.detectChanges();
    await failed.whenStable();

    expect(showErrorModal).toHaveBeenCalled();
    // `hasLoadFailed` is what the panel reads (for its banner) and what `<ix-form>`'s
    // extraDisabled is bound to; that binding blocking Save is covered in the ix-form spec.
    expect(failed.componentInstance.hasLoadFailed()).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
  });

  it('keeps rendering when the bind IP choices fail to load', async () => {
    // The choices reach the template through a `toSignal`, which latches an error and re-throws it
    // on every read — so a failure that isn't caught takes down the whole form render rather than
    // emptying one select. The addresses the config binds to still come from `smb.config`.
    spectator.inject(MockTypedApiService).mockCallError('smb.bindip_choices');

    const loaded = TestBed.createComponent(ServiceSmbComponent);
    loaded.detectChanges();
    await loaded.whenStable();

    expect(loaded.componentInstance.hasLoadFailed()).toBe(false);
    expect(loaded.componentInstance.canSubmit()).toBe(true);
  });

  it('does not duplicate bind IP rows when the config load is replayed', async () => {
    // `loadFormConfig` replays the same patch on every `retryLoad`, and this form's `bindip` rows
    // are PUSHED rather than patched — without the clear at the top of the patch the replay comes
    // back with each address twice.
    spectator.inject(MockTypedApiService).mockCall('smb.config', { ...smbConfig, bindip: ['1.1.1.1', '2.2.2.2'] });

    const reloaded = TestBed.createComponent(ServiceSmbComponent);
    reloaded.detectChanges();

    reloaded.componentInstance.retryLoad();
    reloaded.detectChanges();
    await reloaded.whenStable();

    reloaded.componentInstance.submit();

    expect(api.call).toHaveBeenLastCalledWith('smb.update', [
      expect.objectContaining({ bindip: ['1.1.1.1', '2.2.2.2'] }),
    ]);
  });

  it('loads and shows current settings for Smb service when form is opened', async () => {
    expect(api.call).toHaveBeenCalledWith('smb.config');

    expect(await (await getInput('netbiosname')).getValue()).toBe('truenas');
    expect(await (await getInput('workgroup')).getValue()).toBe('WORKGROUP');
    expect(await (await getInput('description')).getValue()).toBe('TrueNAS Server');
    expect(await (await getSelect('minimum_protocol')).getDisplayText()).toBe('SMB2 – default');
    expect(await (await getCheckbox('ntlmv1_auth')).isChecked()).toBe(false);
  });

  it('exposes a single footer action that flips between Advanced and Basic Settings', () => {
    expect(spectator.component.footerActions).toHaveLength(1);

    const [toggleAdvanced] = spectator.component.footerActions;
    expect(toggleAdvanced.label).toBe('Advanced Settings');
    expect(toggleAdvanced.testId).toBe('toggle-advanced-settings');

    toggleAdvancedSettings();

    expect(spectator.component.footerActions[0].label).toBe('Basic Settings');
  });

  it('shows advanced settings when advanced mode is toggled', async () => {
    toggleAdvancedSettings();

    expect(await (await getInput('netbiosname')).getValue()).toBe('truenas');
    expect(await (await getInput('workgroup')).getValue()).toBe('WORKGROUP');
    expect(await (await getInput('description')).getValue()).toBe('TrueNAS Server');
    expect(await (await getSelect('minimum_protocol')).getDisplayText()).toBe('SMB2 – default');
    expect(await (await getCheckbox('ntlmv1_auth')).isChecked()).toBe(false);

    expect(await (await getSelect('unixcharset')).getDisplayText()).toBe('UTF-8');
    expect(await (await getSelect('encryption')).getDisplayText())
      .toBe('Negotiate – only encrypt transport if explicitly requested by the SMB client');
    expect(await (await getCheckbox('debug')).isChecked()).toBe(true);
    expect(await (await getCheckbox('syslog')).isChecked()).toBe(false);
    expect(await (await getCheckbox('localmaster')).isChecked()).toBe(true);
    expect(await (await getCheckbox('aapl_extensions')).isChecked()).toBe(false);
    expect(await (await getCheckbox('multichannel')).isChecked()).toBe(false);
    expect(await (await getInput('filemask')).getValue()).toBe('');
    expect(await (await getInput('dirmask')).getValue()).toBe('');

    const searchCheckbox = await getCheckbox('spotlight_search');
    expect(await searchCheckbox.isChecked()).toBe(true);
  });

  it('should have Spotlight checkbox unchecked when search_protocols is empty', async () => {
    const smbConfigMock = {
      id: 1,
      netbiosname: 'truenas',
      workgroup: 'WORKGROUP',
      description: 'TrueNAS Server',
      unixcharset: 'UTF-8',
      debug: true,
      syslog: false,
      aapl_extensions: false,
      localmaster: true,
      guest: 'nobody',
      filemask: '',
      dirmask: '',
      bindip: [] as string[],
      ntlmv1_auth: false,
      minimum_protocol: SmbMinProtocol.Smb2,
      admin_group: null,
      encryption: SmbEncryption.Negotiate,
      search_protocols: [],
      stateful_failover: false,
    } as SmbConfigEntry;

    const mockApi = spectator.inject(MockTypedApiService);
    mockApi.mockCall('smb.config', smbConfigMock);
    mockApi.mockQuery('sharing.smb.query', []);

    spectator.component.ngOnInit();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    toggleAdvancedSettings();

    const searchCheckbox = await getCheckbox('spotlight_search');
    expect(await searchCheckbox.isChecked()).toBe(false);
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    await (await getInput('netbiosname')).setValue('truenas-scale');
    await (await getInput('description')).setValue('TrueNAS SCALE Server');
    await (await getSelect('minimum_protocol')).selectOption('SMB1 – legacy clients (not recommended)');
    await (await getCheckbox('ntlmv1_auth')).check();
    await (await getInput('workgroup')).setValue('WORKGROUP2');

    const aliasChips = await loader.getHarness(
      TnChipInputHarness.with({ selector: '[formControlName="netbiosalias"]' }),
    );
    await aliasChips.addChip('truenas-alias');
    await aliasChips.addChip('truenas-alias2');

    toggleAdvancedSettings();
    const searchCheckbox = await getCheckbox('spotlight_search');
    expect(await searchCheckbox.isChecked()).toBe(true);

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenLastCalledWith('smb.update', [{
      // New basic options
      netbiosname: 'truenas-scale',
      netbiosalias: ['truenas-alias', 'truenas-alias2'],
      description: 'TrueNAS SCALE Server',
      minimum_protocol: SmbMinProtocol.Smb1,
      ntlmv1_auth: true,
      workgroup: 'WORKGROUP2',

      // Old advanced options
      aapl_extensions: false,
      admin_group: null,
      bindip: [],
      guest: 'nobody',
      dirmask: '',
      filemask: '',
      debug: true,
      localmaster: true,
      syslog: false,
      multichannel: false,
      unixcharset: 'UTF-8',
      encryption: SmbEncryption.Negotiate,
      search_protocols: [smbSearchSpotlight],
      stateful_failover: false,
    }]);
  });

  it('sends an update payload to websocket when advanced form is filled and saved', async () => {
    toggleAdvancedSettings();

    const bindIpList = await loader.getHarness(TnFormListHarness.with({ label: 'Bind IP Addresses' }));
    await bindIpList.add();
    await bindIpList.add();

    const bindIpSelects = await loader.getAllHarnesses(
      TnSelectHarness.with({ selector: '[formControlName="bindIp"]' }),
    );
    await bindIpSelects[0].selectOption('1.1.1.1');
    await bindIpSelects[1].selectOption('2.2.2.2');

    await (await getSelect('unixcharset')).selectOption('UTF_16');
    await (await getCheckbox('syslog')).check();
    await (await getCheckbox('debug')).check();
    await (await getCheckbox('localmaster')).uncheck();
    await (await getCheckbox('aapl_extensions')).check();
    await (await getSelect('encryption')).selectOption('Default – follow upstream / TrueNAS default');

    const adminGroup = await loader.getHarness(TnAutocompleteHarness.with({ placeholder: 'Administrators Group' }));
    // Zone-based harness stabilization waits out the debounced option fetch on
    // blur, so the label match commits the option without an explicit wait.
    await adminGroup.setInputValue('test-group');
    await adminGroup.blur();
    await (await getInput('filemask')).setValue('0666');
    await (await getInput('dirmask')).setValue('0777');

    const searchCheckbox = await getCheckbox('spotlight_search');
    await searchCheckbox.toggle();
    expect(await searchCheckbox.isChecked()).toBe(false);

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(api.call).toHaveBeenLastCalledWith('smb.update', [{
      // Old basic options
      netbiosname: 'truenas',
      netbiosalias: [],
      description: 'TrueNAS Server',
      minimum_protocol: SmbMinProtocol.Smb2,
      ntlmv1_auth: false,
      workgroup: 'WORKGROUP',

      // New advanced options
      aapl_extensions: true,
      admin_group: 'test-group',
      bindip: [
        '1.1.1.1',
        '2.2.2.2',
      ],
      guest: 'nobody',
      dirmask: '0777',
      filemask: '0666',
      debug: true,
      localmaster: false,
      syslog: true,
      multichannel: false,
      unixcharset: 'UTF_16',
      encryption: SmbEncryption.Default,
      search_protocols: [],
      stateful_failover: false,
    }]);
  });

  describe('Spotlight search (TRUESEARCH entitlement)', () => {
    const denied = {
      [EntitlementFeature.TrueSearch]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: "This system's license does not include TrueSearch.",
      },
    };

    it('enables the Spotlight checkbox and shows no notice when entitled to TRUESEARCH', async () => {
      toggleAdvancedSettings();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(false);
      expect(spectator.query('#spotlight-notice')).toBeFalsy();
    });

    it('disables the Spotlight checkbox and shows a licensing notice when not entitled to TRUESEARCH', async () => {
      // The facade caches the per-feature signal, so the override needs refreshState to reach it.
      store$.overrideSelector(selectEntitlements, denied);
      store$.refreshState();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(true);

      const notice = spectator.query('#spotlight-notice');
      expect(notice).toBeTruthy();
      expect(notice).toHaveText("Search (Spotlight) is not included in this system's license.");
    });
  });

  describe('Stateful Failover validation', () => {
    it('should not show Stateful Failover checkbox when HA is not licensed', async () => {
      store$.overrideSelector(selectIsHaLicensed, false);
      store$.refreshState();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      const statefulFailoverCheckbox = await loader.getHarnessOrNull(
        TnCheckboxHarness.with({ selector: '[formControlName="stateful_failover"]' }),
      );
      expect(statefulFailoverCheckbox).toBeNull();
    });

    it('should show and enable Stateful Failover checkbox when HA is licensed with no incompatible shares and SMB1 disabled', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(false);
    });

    it('should disable Stateful Failover checkbox when there are incompatible shares', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      const mockApi = spectator.inject(MockTypedApiService);
      mockApi.mockCall('smb.config', {
        netbiosname: 'truenas',
        workgroup: 'WORKGROUP',
        description: '',
        minimum_protocol: SmbMinProtocol.Smb2,
        bindip: [],
        encryption: SmbEncryption.Negotiate,
        search_protocols: [],
        stateful_failover: false,
      } as SmbConfigEntry);
      mockApi.mockQuery(
        'sharing.smb.query',
        [{ purpose: SmbSharePurpose.MultiProtocolShare }] as WebUiQueryEntity<'sharing.smb.query'>[],
      );

      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(true);
    });

    it('should disable Stateful Failover checkbox when minimum protocol is SMB1', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      const mockApi = spectator.inject(MockTypedApiService);
      mockApi.mockCall('smb.config', {
        netbiosname: 'truenas',
        workgroup: 'WORKGROUP',
        description: '',
        minimum_protocol: SmbMinProtocol.Smb1,
        bindip: [],
        encryption: SmbEncryption.Negotiate,
        search_protocols: [],
        stateful_failover: false,
      } as SmbConfigEntry);
      mockApi.mockQuery('sharing.smb.query', []);

      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(true);
    });

    it('should re-enable Stateful Failover checkbox when minimum protocol is changed from SMB1', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      toggleAdvancedSettings();

      // Initially enabled (no incompatible shares, minimum protocol is SMB2)
      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(false);

      // Set minimum protocol to SMB1
      const minimumProtocolSelect = await getSelect('minimum_protocol');
      await minimumProtocolSelect.selectOption('SMB1 – legacy clients (not recommended)');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should be disabled now
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(true);

      // Set minimum protocol back to SMB2
      await minimumProtocolSelect.selectOption('SMB2 – default');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Should be enabled again
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(false);
    });
  });
});
