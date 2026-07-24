import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteHarness, TnCheckboxHarness, TnChipInputHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SmbEncryption } from 'app/enums/smb-encryption.enum';
import { SmbMinProtocol } from 'app/enums/smb-min-protocol.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { SmbConfig, smbSearchSpotlight } from 'app/interfaces/smb-config.interface';
import { SmbShare, SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UserService } from 'app/services/user.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('ServiceSmbComponent', () => {
  let spectator: Spectator<ServiceSmbComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let store$: MockStore;

  const tncConfigSignal = signal<TruenasConnectConfig>({
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig);

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: ServiceSmbComponent,
    imports: [
      ReactiveFormsModule,
      TranslateModule.forRoot(),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('smb.config', {
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
          cifs_SID: 'mockSid',
          ntlmv1_auth: false,
          minimum_protocol: SmbMinProtocol.Smb2,
          admin_group: null,
          next_rid: 0,
          encryption: SmbEncryption.Negotiate,
          search_protocols: [smbSearchSpotlight],
          stateful_failover: false,
        } as SmbConfig),
        mockCall('sharing.smb.query', [] as SmbShare[]),
        mockCall('smb.unixcharset_choices', {
          'UTF-8': 'UTF-8',
          'UTF-16': 'UTF-16',
        }),
        mockCall('smb.bindip_choices', {
          '1.1.1.1': '1.1.1.1',
          '2.2.2.2': '2.2.2.2',
        }),
        mockCall('smb.update'),
        mockCall('failover.licensed', false),
        mockCall(
          'user.query',
          [
            { id: 41, username: 'dummy-user' },
            { id: 42, username: 'second-user' },
          ] as User[],
        ),
      ]),
      ...ixFormTestingProviders(),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
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
      mockProvider(TruenasConnectService, {
        config: tncConfigSignal,
        openStatusModal: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          { selector: selectIsEnterprise, value: false },
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
    ],
  });

  beforeEach(() => {
    tncConfigSignal.set({
      status: TruenasConnectStatus.Configured,
    } as TruenasConnectConfig);

    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    store$ = spectator.inject(MockStore);
  });

  it('loads and shows current settings for Smb service when form is opened', async () => {
    expect(api.call).toHaveBeenCalledWith('smb.config');

    expect(await (await getInput('netbiosname')).getValue()).toBe('truenas');
    expect(await (await getInput('workgroup')).getValue()).toBe('WORKGROUP');
    expect(await (await getInput('description')).getValue()).toBe('TrueNAS Server');
    expect(await (await getSelect('minimum_protocol')).getDisplayText()).toBe('SMB2 – default');
    expect(await (await getCheckbox('ntlmv1_auth')).isChecked()).toBe(false);
  });

  it('shows advanced settings when Advanced Settings button is pressed', async () => {
    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

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
      cifs_SID: 'mockSid',
      ntlmv1_auth: false,
      minimum_protocol: SmbMinProtocol.Smb2,
      admin_group: null,
      next_rid: 0,
      encryption: SmbEncryption.Negotiate,
      search_protocols: [],
      stateful_failover: false,
    } as SmbConfig;

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method: string) => {
      if (method === 'smb.config') {
        return of(smbConfigMock);
      }
      if (method === 'sharing.smb.query') {
        return of([] as SmbShare[]);
      }
      return of(null);
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

    const searchCheckbox = await getCheckbox('spotlight_search');
    expect(await searchCheckbox.isChecked()).toBe(false);
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    // <ix-form> logs a dev-only nested-changedValues notice because `bindip` is a FormArray;
    // this form builds its payload from getRawValue(), so the notice is advisory here.
    jest.spyOn(console, 'warn').mockImplementation();
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

    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();
    const searchCheckbox = await getCheckbox('spotlight_search');
    expect(await searchCheckbox.isChecked()).toBe(true);

    spectator.component.submit();

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
    // <ix-form> logs a dev-only nested-changedValues notice because `bindip` is a FormArray;
    // this form builds its payload from getRawValue(), so the notice is advisory here.
    jest.spyOn(console, 'warn').mockImplementation();
    spectator.component.onAdvancedSettingsToggled();
    spectator.detectChanges();

    const bindIpList = await loader.getHarness(IxListHarness.with({ label: 'Bind IP Addresses' }));
    await bindIpList.pressAddButton();
    await bindIpList.pressAddButton();

    const bindIpSelects = await loader.getAllHarnesses(
      TnSelectHarness.with({ selector: '[formControlName="bindIp"]' }),
    );
    await bindIpSelects[0].selectOption('1.1.1.1');
    await bindIpSelects[1].selectOption('2.2.2.2');

    await (await getSelect('unixcharset')).selectOption('UTF-16');
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
      unixcharset: 'UTF-16',
      encryption: SmbEncryption.Default,
      search_protocols: [],
      stateful_failover: false,
    }]);
  });

  describe('TrueNAS Connect validation', () => {
    it('should disable Spotlight checkbox when TrueNAS Connect is not configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(true);
    });

    it('should enable Spotlight checkbox when TrueNAS Connect is configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Configured,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(false);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(false);
    });

    it('should enable Spotlight checkbox when TrueNAS Connect becomes configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(true);

      // Status changes to configured
      tncConfigSignal.set({
        status: TruenasConnectStatus.Configured,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(await searchCheckbox.isDisabled()).toBe(false);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(false);
    });

    it('should show TrueNAS Connect notice when not configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeTruthy();
      expect(notice.textContent).toContain('Configure TrueNAS Connect to enable this feature.');
    });

    it('should not show TrueNAS Connect notice when configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Configured,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeFalsy();
    });

    it('should open TrueNAS Connect modal when clicking the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const truenasConnectService = spectator.inject(TruenasConnectService);

      const noticeLink = spectator.query('.truenas-connect-link');
      spectator.click(noticeLink);

      expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
    });

    it('should open TrueNAS Connect modal when pressing Enter on the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const truenasConnectService = spectator.inject(TruenasConnectService);

      const noticeLink = spectator.query('.truenas-connect-link') as HTMLElement;
      spectator.dispatchKeyboardEvent(noticeLink, 'keydown', 'Enter');

      expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
    });

    it('should open TrueNAS Connect modal when pressing Space on the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const truenasConnectService = spectator.inject(TruenasConnectService);

      const noticeLink = spectator.query('.truenas-connect-link') as HTMLElement;
      spectator.dispatchKeyboardEvent(noticeLink, 'keydown', ' ');

      expect(truenasConnectService.openStatusModal).toHaveBeenCalled();
    });

    it('should not open TrueNAS Connect modal when pressing other keys on the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const truenasConnectService = spectator.inject(TruenasConnectService);

      const noticeLink = spectator.query('.truenas-connect-link') as HTMLElement;
      spectator.dispatchKeyboardEvent(noticeLink, 'keydown', 'Tab');

      expect(truenasConnectService.openStatusModal).not.toHaveBeenCalled();
    });

    it('should have proper accessibility attributes on the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const noticeLink = spectator.query('.truenas-connect-link') as HTMLElement;
      expect(noticeLink.getAttribute('role')).toBe('button');
      expect(noticeLink.getAttribute('tabindex')).toBe('0');
    });

    it('should enable Spotlight checkbox on Enterprise system even if TrueNAS Connect is not configured', async () => {
      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();

      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(false);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(false);
    });

    it('should not show TrueNAS Connect notice on Enterprise system', async () => {
      store$.overrideSelector(selectIsEnterprise, true);
      store$.refreshState();

      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeFalsy();
    });

    it('should disable Spotlight checkbox on non-Enterprise system without TrueNAS Connect', async () => {
      store$.overrideSelector(selectIsEnterprise, false);
      store$.refreshState();

      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const searchCheckbox = await getCheckbox('spotlight_search');
      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(true);

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeTruthy();
    });
  });

  describe('Stateful Failover validation', () => {
    it('should not show Stateful Failover checkbox when HA is not licensed', async () => {
      store$.overrideSelector(selectIsHaLicensed, false);
      store$.refreshState();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

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

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(false);
    });

    it('should disable Stateful Failover checkbox when there are incompatible shares', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method: string) => {
        if (method === 'sharing.smb.query') {
          return of([{ purpose: SmbSharePurpose.MultiProtocolShare }] as SmbShare[]);
        }
        if (method === 'smb.config') {
          return of({
            netbiosname: 'truenas',
            workgroup: 'WORKGROUP',
            description: '',
            minimum_protocol: SmbMinProtocol.Smb2,
            bindip: [],
            encryption: SmbEncryption.Negotiate,
            search_protocols: [],
            stateful_failover: false,
          } as SmbConfig);
        }
        return of(null);
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(true);
    });

    it('should disable Stateful Failover checkbox when minimum protocol is SMB1', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method: string) => {
        if (method === 'sharing.smb.query') {
          return of([] as SmbShare[]);
        }
        if (method === 'smb.config') {
          return of({
            netbiosname: 'truenas',
            workgroup: 'WORKGROUP',
            description: '',
            minimum_protocol: SmbMinProtocol.Smb1,
            bindip: [],
            encryption: SmbEncryption.Negotiate,
            search_protocols: [],
            stateful_failover: false,
          } as SmbConfig);
        }
        return of(null);
      });

      spectator.component.ngOnInit();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

      const statefulFailoverCheckbox = await getCheckbox('stateful_failover');
      expect(await statefulFailoverCheckbox.isDisabled()).toBe(true);
    });

    it('should re-enable Stateful Failover checkbox when minimum protocol is changed from SMB1', async () => {
      store$.overrideSelector(selectIsHaLicensed, true);
      store$.refreshState();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      spectator.component.onAdvancedSettingsToggled();
      spectator.detectChanges();

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
