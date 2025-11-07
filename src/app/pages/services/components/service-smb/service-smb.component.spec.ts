import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SmbEncryption } from 'app/enums/smb-encryption.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { SmbConfig, smbSearchSpotlight } from 'app/interfaces/smb-config.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { User } from 'app/interfaces/user.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { UserService } from 'app/services/user.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

describe('ServiceSmbComponent', () => {
  let spectator: Spectator<ServiceSmbComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let store$: MockStore;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const tncConfigSignal = signal<TruenasConnectConfig>({
    status: TruenasConnectStatus.Configured,
  } as TruenasConnectConfig);

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
          enable_smb1: false,
          admin_group: null,
          next_rid: 0,
          encryption: SmbEncryption.Negotiate,
          search_protocols: [smbSearchSpotlight],
        } as SmbConfig),
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
      mockProvider(SlideIn),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(SystemGeneralService),
      mockProvider(UserService, {
        groupQueryDsCache: jest.fn(() => of([{
          group: 'test-group',
        }])),
        userQueryDsCache: jest.fn(() => of([{
          username: 'test-username',
        }])),
        getGroupByName: jest.fn((groupName: string) => {
          // Simulate API behavior: valid groups exist, invalid ones return error observable
          if (groupName === 'test-group' || groupName === 'valid-ad-group' || groupName === 'administrators') {
            return of({ group: groupName, gid: 1000 });
          }
          return throwError(() => new Error('Group not found'));
        }),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(TruenasConnectService, {
        config: tncConfigSignal,
        openStatusModal: jest.fn(),
      }),
      provideMockStore({
        selectors: [
          { selector: selectIsEnterprise, value: false },
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
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(api.call).toHaveBeenCalledWith('smb.config');
    expect(values).toEqual({
      'NetBIOS Name': 'truenas',
      'NetBIOS Alias': [],
      Workgroup: 'WORKGROUP',
      Description: 'TrueNAS Server',
      'Enable SMB1 support': false,
      'NTLMv1 Auth': false,
    });
  });

  it('shows advanced settings when Advanced Settings button is pressed', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Administrators Group': '',
      Description: 'TrueNAS Server',
      'Directory Mask': '',
      'Enable Apple SMB2/3 Protocol Extensions': false,
      'Enable SMB1 support': false,
      'File Mask': '',
      'Guest Account': '',
      'Local Master': true,
      'NTLMv1 Auth': false,
      'NetBIOS Alias': [],
      'NetBIOS Name': 'truenas',
      'Transport Encryption Behavior': 'Negotiate – only encrypt transport if explicitly requested by the SMB client',
      Multichannel: false,
      'UNIX Charset': 'UTF-8',
      'Use Debug': true,
      'Use Syslog Only': false,
      Workgroup: 'WORKGROUP',
      'Enable Search (Spotlight)': true,
    });

    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
    expect(await searchCheckbox.getValue()).toBe(true);
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
      enable_smb1: false,
      admin_group: null,
      next_rid: 0,
      encryption: SmbEncryption.Negotiate,
      search_protocols: [],
    } as SmbConfig;

    jest.spyOn(spectator.inject(ApiService), 'call').mockImplementation((method: string) => {
      if (method === 'smb.config') {
        return of(smbConfigMock);
      }
      return of(null);
    });

    spectator.component.ngOnInit();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
    expect(await searchCheckbox.getValue()).toBe(false);
  });

  it('sends an update payload to websocket when basic form is filled and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'NetBIOS Name': 'truenas-scale',
      'NetBIOS Alias': ['truenas-alias', 'truenas-alias2'],
      Description: 'TrueNAS SCALE Server',
      'Enable SMB1 support': true,
      'NTLMv1 Auth': true,
      Workgroup: 'WORKGROUP2',
    });

    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();
    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
    expect(await searchCheckbox.getValue()).toBe(true);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenLastCalledWith('smb.update', [{
      // New basic options
      netbiosname: 'truenas-scale',
      netbiosalias: ['truenas-alias', 'truenas-alias2'],
      description: 'TrueNAS SCALE Server',
      enable_smb1: true,
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
    }]);
  });

  it('sends an update payload to websocket when advanced form is filled and saved', async () => {
    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
    await advancedButton.click();

    const bindIpList = await loader.getHarness(IxListHarness.with({ label: 'Bind IP Addresses' }));
    await bindIpList.pressAddButton();
    const bindIpForm1 = await bindIpList.getLastListItem();
    await bindIpForm1.fillForm({ 'IP Address': '1.1.1.1' });
    await bindIpList.pressAddButton();
    const bindIpForm2 = await bindIpList.getLastListItem();
    await bindIpForm2.fillForm({ 'IP Address': '2.2.2.2' });

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'UNIX Charset': 'UTF-16',
      'Use Syslog Only': true,
      'Use Debug': true,
      'Local Master': false,
      'Enable Apple SMB2/3 Protocol Extensions': true,
      'Administrators Group': 'test-group',
      'File Mask': '0666',
      'Directory Mask': '0777',
      'Transport Encryption Behavior': 'Default – follow upstream / TrueNAS default',
    });

    const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
    await searchCheckbox.toggle();
    expect(await searchCheckbox.getValue()).toBe(false);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenLastCalledWith('smb.update', [{
      // Old basic options
      netbiosname: 'truenas',
      netbiosalias: [],
      description: 'TrueNAS Server',
      enable_smb1: false,
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
    }]);
  });

  describe('TrueNAS Connect validation', () => {
    it('should disable Spotlight checkbox when TrueNAS Connect is not configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(true);
    });

    it('should enable Spotlight checkbox when TrueNAS Connect is configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Configured,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
      expect(await searchCheckbox.isDisabled()).toBe(false);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(false);
    });

    it('should enable Spotlight checkbox when TrueNAS Connect becomes configured', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeFalsy();
    });

    it('should open TrueNAS Connect modal when clicking the notice link', async () => {
      tncConfigSignal.set({
        status: TruenasConnectStatus.Disabled,
      } as TruenasConnectConfig);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

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

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const searchCheckbox = await loader.getHarness(IxCheckboxHarness.with({ selector: '[formControlName="spotlight_search"]' }));
      expect(await searchCheckbox.isDisabled()).toBe(true);
      expect(spectator.component.form.controls.spotlight_search.disabled).toBe(true);

      const notice = spectator.query('.truenas-connect-notice');
      expect(notice).toBeTruthy();
    });
  });

  describe('Administrators Group validation', () => {
    it('should allow custom values for Administrators Group field', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('valid-ad-group');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      expect(spectator.component.form.controls.admin_group.value).toBe('valid-ad-group');
      expect(spectator.component.form.controls.admin_group.valid).toBe(true);
    }));

    it('should validate that admin group exists using async validator', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('administrators');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const userService = spectator.inject(UserService);
      expect(userService.getGroupByName).toHaveBeenCalledWith('administrators');
      expect(spectator.component.form.controls.admin_group.valid).toBe(true);
      expect(spectator.component.form.controls.admin_group.errors).toBeNull();
    }));

    it('should show error when admin group does not exist', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('nonexistent-group');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const userService = spectator.inject(UserService);
      expect(userService.getGroupByName).toHaveBeenCalledWith('nonexistent-group');
      expect(spectator.component.form.controls.admin_group.valid).toBe(false);
      expect(spectator.component.form.controls.admin_group.errors).toEqual({
        groupNotFound: {
          message: 'Group "nonexistent-group" not found. Please verify the group name.',
        },
      });
    }));

    it('should allow empty admin group value', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const userService = spectator.inject(UserService);
      // Should not call validation for empty values
      expect(userService.getGroupByName).not.toHaveBeenCalledWith('');
      expect(spectator.component.form.controls.admin_group.valid).toBe(true);
      expect(spectator.component.form.controls.admin_group.errors).toBeNull();
    }));

    it('should submit form with valid custom admin group', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('valid-ad-group');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith('smb.update', [
        expect.objectContaining({
          admin_group: 'valid-ad-group',
        }),
      ]);
    }));

    it('should disable Save button when admin group validation fails', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('invalid-group');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    }));

    it('should work with AD groups that have many members', fakeAsync(async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Settings' }));
      await advancedButton.click();

      // Simulate typing an AD group name
      const adminGroupControl = await loader.getHarness(IxComboboxHarness.with({ label: 'Administrators Group' }));
      await adminGroupControl.writeCustomValue('valid-ad-group');

      // Wait for debounce (500ms) and async validation
      tick(500);
      await spectator.fixture.whenStable();

      const userService = spectator.inject(UserService);
      expect(userService.getGroupByName).toHaveBeenCalledWith('valid-ad-group');
      expect(spectator.component.form.controls.admin_group.valid).toBe(true);
    }));
  });
});
