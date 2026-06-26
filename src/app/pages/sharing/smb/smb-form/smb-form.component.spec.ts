import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness,
  TnCheckboxHarness,
  TnChipInputHarness,
  TnDialog,
  TnFormFieldHarness,
  TnInputHarness,
  TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbConfig } from 'app/interfaces/smb-config.interface';
import {
  FcpSmbShare,
  LegacySmbShareOptions,
  SmbSharePurpose,
  SmbShare,
} from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { WarningHarness } from 'app/modules/forms/ix-forms/components/warning/warning.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { RestartSmbDialog } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { SmbUsersWarningComponent } from 'app/pages/sharing/smb/smb-form/smb-users-warning/smb-users-warning.component';
import { ApiCallError } from 'app/services/errors/error.classes';
import { FilesystemService } from 'app/services/filesystem.service';
import { UserService } from 'app/services/user.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { SmbFormComponent } from './smb-form.component';

describe('SmbFormComponent', () => {
  const existingShare = {
    id: 1,
    purpose: SmbSharePurpose.DefaultShare,
    name: 'ds222',
    path: '/mnt/pool123/ds222',
    locked: false,
    readonly: true,
    browsable: true,
    access_based_share_enumeration: true,
    enabled: true,
    comment: 'Description',
    audit: {
      enable: false,
      watch_list: [] as string[],
      ignore_list: [] as string[],
    },
    options: {
      aapl_name_mangling: true,
    },
  } as SmbShare;

  const slideInRef: SlideInRef<{ existingSmbShare?: SmbShare; defaultSmbShare?: SmbShare } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const formLabels: Record<string, string> = {
    path: 'Path',
  };

  let spectator: Spectator<SmbFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;
  let mockStore$: MockStore<AppState>;
  let store$: Store<AppState>;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnCheckboxes = (name: string): Promise<TnCheckboxHarness[]> => loader.getAllHarnesses(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  // tn-select fires a value change even when re-selecting the currently displayed option,
  // which re-runs the purpose presets and wipes edit-loaded values. Mirror the Material
  // dedupe by only selecting when the displayed purpose actually differs.
  const selectPurpose = async (label: string): Promise<void> => {
    const select = await getTnSelect('purpose');
    if ((await select.getDisplayText()) !== label) {
      await select.selectOption(label);
    }
  };
  const setTnCheckbox = async (name: string, value: boolean): Promise<void> => {
    const checkbox = await getTnCheckbox(name);
    if (value) {
      await checkbox.check();
    } else {
      await checkbox.uncheck();
    }
  };

  const createComponent = createComponentFactory({
    component: SmbFormComponent,
    imports: [
      ReactiveFormsModule,
      WarningComponent,
      MockComponent(SmbUsersWarningComponent),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('group.query', [{ id: 1, group: 'test', builtin: false }] as Group[]),
        mockCall('group.get_group_obj', { gr_gid: 1000, gr_name: 'test', gr_mem: [] }),
        mockCall('sharing.smb.create', { ...existingShare }),
        mockCall('sharing.smb.update', { ...existingShare }),
        mockCall('sharing.smb.share_precheck', null),
        mockCall('sharing.smb.query', [
          { ...existingShare },
        ]),
        mockCall('filesystem.stat', {
          acl: true,
        } as FileSystemStat),
        mockCall('smb.config', { aapl_extensions: true } as SmbConfig),
        mockCall('user.query', []),
        mockJob('service.control', fakeSuccessfulJob()),
      ]),
      mockProvider(SlideIn, {
        openSlideIns: jest.fn(() => 1),
      }),
      mockProvider(Router),
      mockProvider(LoaderService),
      mockProvider(FilesystemService, {
        getTopLevelDatasetsNodes: jest.fn(() => {
          return of([
            {
              path: 'pool',
              name: 'pool',
            },
          ]);
        }),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(true),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        info: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef, slideInRef),
      provideMockStore({
        selectors: [{
          selector: selectServices,
          value: [],
        },
        {
          selector: selectIsEnterprise,
          value: true,
        }],
      }),
      mockProvider(FormErrorHandlerService, {
        handleValidationErrors: jest.fn(),
      }),
      provideTnFormFieldErrors(),
    ],
  });

  async function setupTest(share?: Partial<SmbShare>): Promise<void> {
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, {
          ...slideInRef,
          getData: () => ({
            existingSmbShare: share
              ? { ...existingShare, ...share }
              : null,
          }),
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    mockStore$ = spectator.inject(MockStore);
    api = spectator.inject(ApiService);

    // The toggle's label flips between 'Advanced Options' and 'Basic Options';
    // only click when it currently offers to reveal the advanced section.
    const advancedButton = await loader.getHarnessOrNull(
      TnButtonHarness.with({ label: 'Advanced Options' }),
    );
    if (advancedButton) {
      await advancedButton.click();
    }
  }

  /**
   * Applies the migrated tn-* and remaining ix-* common fields used across create/update payloads.
   * `Path` stays an ix-explorer; the rest are tn-* controls driven via their harnesses.
   */
  async function applyCommonValues(): Promise<void> {
    const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
    await pathControl.setValue('/mnt/pool123/ds222');
    await (await getTnInput('name')).setValue('Default');
    await (await getTnInput('comment')).setValue('Description');
    await setTnCheckbox('enabled', true);
    await setTnCheckbox('readonly', true);
    await setTnCheckbox('browsable', true);
    await setTnCheckbox('access_based_share_enumeration', true);
    await setTnCheckbox('enable', false);
  }

  async function clickSave(): Promise<void> {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
  }

  describe('legacy share', () => {
    beforeEach(async () => {
      await setupTest({ purpose: SmbSharePurpose.LegacyShare });

      await selectPurpose('Legacy Share');
    });

    it('should show confirmation warning when afp is checked', async () => {
      const afpCheckbox = await getTnCheckbox('afp');
      await afpCheckbox.check();
      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.afpWarningTitle,
        message: helptextSharingSmb.afpWarningMessage,
        hideCheckbox: false,
        buttonText: helptextSharingSmb.afpDialogButton,
        hideCancel: false,
      });
    });

    it('shows a warning when opening Legacy Share for editing', async () => {
      const warning = await loader.getHarness(WarningHarness);
      expect(await warning.getText()).toContain(
        'For the best experience, we recommend choosing a modern SMB share purpose instead of the legacy option.',
      );
    });

    it('should show restart dialog when save is clicked with any changes', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: true,
        state: ServiceStatus.Running,
      } as Service]);

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/new');

      await clickSave();

      expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(RestartSmbDialog);

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        helptextSharingSmb.restartedSmbDialog.message,
      );
    });

    it('should not restart service when user clicks No in restart dialog', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      const tnDialog = spectator.inject(TnDialog);
      tnDialog.open = jest.fn(() => ({
        closed: of(false),
      })) as unknown as typeof tnDialog.open;

      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: true,
        state: ServiceStatus.Running,
      } as Service]);

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/new');

      await clickSave();

      expect(tnDialog.open).toHaveBeenCalledWith(RestartSmbDialog);
      // The wrapper still shows its own "SMB share updated" success toast, but the
      // service-restart toast must not appear when the user declines the restart.
      expect(spectator.inject(SnackbarService).success).not.toHaveBeenCalledWith(
        helptextSharingSmb.restartedSmbDialog.message,
      );
    });

    it('should show strip acl warning if acl is trivial when path changes', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      // Wait for path change to be processed and ACL checkbox to appear
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const aclCheckbox = await getTnCheckbox('acl');
      await aclCheckbox.uncheck();

      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      });
    });
  });

  describe('creating share of each type', () => {
    beforeEach(async () => {
      await setupTest();
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('creates default share', async () => {
      await selectPurpose('Default Share');
      await applyCommonValues();
      await (await getTnCheckbox('aapl_name_mangling')).check();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [{
        purpose: SmbSharePurpose.DefaultShare,
        name: 'Default',
        path: '/mnt/pool123/ds222',
        enabled: true,
        comment: 'Description',
        readonly: true,
        browsable: true,
        access_based_share_enumeration: true,
        audit: {
          enable: false,
          ignore_list: [],
          watch_list: [],
        },
        options: {
          aapl_name_mangling: true,
          hostsallow: [],
          hostsdeny: [],
        },
      }]);
    });

    it('creates time machine share', async () => {
      await selectPurpose('Time Machine Share');
      await applyCommonValues();
      const timeMachineQuota = await loader.getHarness(IxInputHarness.with({ label: 'Time Machine Quota' }));
      await timeMachineQuota.setValue('10G');
      await (await getTnInput('vuid')).setValue('08e00781-18ac-4c6c-bfeb-9c1c504ea0d7');
      await (await getTnCheckbox('auto_snapshot')).check();
      await (await getTnCheckbox('auto_dataset_creation')).check();
      await (await getTnInput('dataset_naming_schema')).setValue('%u');

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeMachineShare,
          options: {
            timemachine_quota: 10 * GiB,
            vuid: '08e00781-18ac-4c6c-bfeb-9c1c504ea0d7',
            auto_snapshot: true,
            auto_dataset_creation: true,
            dataset_naming_schema: '%u',
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('creates Multi-Protocol share', async () => {
      await selectPurpose('Multi-Protocol Share');
      await applyCommonValues();
      await (await getTnCheckbox('aapl_name_mangling')).check();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.MultiProtocolShare,
          options: {
            aapl_name_mangling: true,
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('creates Time Locked share', async () => {
      await selectPurpose('Time Locked Share');
      await applyCommonValues();
      await (await getTnInput('grace_period')).setValue('900');
      await (await getTnCheckbox('aapl_name_mangling')).check();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeLockedShare,
          options: {
            grace_period: 900,
            aapl_name_mangling: true,
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('creates Private Datasets share', async () => {
      await selectPurpose('Private Datasets Share');
      await applyCommonValues();
      await (await getTnInput('dataset_naming_schema')).setValue('%u');
      await (await getTnInput('auto_quota')).setValue('20');
      await (await getTnCheckbox('aapl_name_mangling')).check();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.PrivateDatasetsShare,
          options: {
            dataset_naming_schema: '%u',
            auto_quota: 20,
            aapl_name_mangling: true,
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('creates External share', async () => {
      await selectPurpose('External Share');
      await (await getTnInput('name')).setValue('Default');
      await (await getTnInput('comment')).setValue('Description');
      await setTnCheckbox('enabled', true);
      await (await getTnChipInput('remote_path')).addChip('192.168.0.1\\SHARE');

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.ExternalShare,
          options: {
            remote_path: ['192.168.0.1\\SHARE'],
          },
        }),
      ]);
    });

    it('creates Veeam Repository share', async () => {
      await selectPurpose('Veeam Repository Share');
      await applyCommonValues();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.VeeamRepositoryShare,
          options: {
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('creates FCP (Final Cut Pro Storage Share) share', async () => {
      await selectPurpose('Final Cut Pro Storage Share');
      await applyCommonValues();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.FcpShare,
          name: 'Default',
          path: '/mnt/pool123/ds222',
          enabled: true,
          comment: 'Description',
          readonly: true,
          browsable: true,
          access_based_share_enumeration: true,
          audit: {
            enable: false,
            ignore_list: [],
            watch_list: [],
          },
          options: {
            aapl_name_mangling: true,
            hostsallow: [],
            hostsdeny: [],
          },
        }),
      ]);
    });

    it('sends hosts allow and deny values when specified', async () => {
      await selectPurpose('Default Share');
      await applyCommonValues();
      const hostsAllow = await getTnChipInput('hostsallow');
      await hostsAllow.addChip('192.168.1.0/24');
      await hostsAllow.addChip('10.0.0.1');
      await (await getTnChipInput('hostsdeny')).addChip('172.16.0.0/16');

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.DefaultShare,
          options: expect.objectContaining({
            hostsallow: ['192.168.1.0/24', '10.0.0.1'],
            hostsdeny: ['172.16.0.0/16'],
          }),
        }),
      ]);
    });
  });

  describe('edit default share', () => {
    beforeEach(async () => {
      await setupTest({ purpose: SmbSharePurpose.DefaultShare });

      await selectPurpose('Default Share');
    });

    it('shows values of existing share when editing', async () => {
      expect(await (await getTnSelect('purpose')).getDisplayText()).toBe('Default Share');
      expect(await (await getTnInput('name')).getValue()).toBe('ds222');
      expect(await (await getTnInput('comment')).getValue()).toBe('Description');
      expect(await (await getTnCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('readonly')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('browsable')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('access_based_share_enumeration')).isChecked()).toBe(true);
      expect(await (await getTnCheckbox('enable')).isChecked()).toBe(false);
      expect(await (await getTnChipInput('hostsallow')).getChips()).toEqual([]);
      expect(await (await getTnChipInput('hostsdeny')).getChips()).toEqual([]);
      expect(await (await getTnCheckbox('aapl_name_mangling')).isChecked()).toBe(true);

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      expect(await pathControl.getValue()).toBe('/mnt/pool123/ds222');
    });

    it('should show warning if aaple_name_mangling value changes when editing', async () => {
      const aaplNameManglingCheckbox = await getTnCheckbox('aapl_name_mangling');

      if ((existingShare.options as LegacySmbShareOptions).aapl_name_mangling) {
        await aaplNameManglingCheckbox.uncheck();
      } else {
        await aaplNameManglingCheckbox.check();
      }
      expect(spectator.inject(DialogService).confirm).toHaveBeenNthCalledWith(1, {
        title: helptextSharingSmb.manglingDialog.title,
        message: helptextSharingSmb.manglingDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.manglingDialog.action,
        hideCancel: true,
      });
    });

    it('should not show warning if aaple_name_mangling value is unchanged when editing', async () => {
      await setTnCheckbox(
        'aapl_name_mangling',
        (existingShare.options as LegacySmbShareOptions).aapl_name_mangling,
      );

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    });
  });

  describe('edit share with legacy audit logging', () => {
    beforeEach(async () => {
      await setupTest({
        purpose: SmbSharePurpose.DefaultShare,
        audit: {
          enable: true,
          watch_list: [],
          ignore_list: [],
        },
      });
    });

    it('disables save when audit logging has no groups', async () => {
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });
  });

  describe('edit FCP share', () => {
    it('shows aapl_name_mangling checkbox as checked and disabled for FCP share', async () => {
      await setupTest({
        purpose: SmbSharePurpose.FcpShare,
        options: { aapl_name_mangling: true },
      } as FcpSmbShare);

      const checkbox = await getTnCheckbox('aapl_name_mangling');

      expect(await checkbox.isChecked()).toBe(true);
      expect(await checkbox.isDisabled()).toBe(true);
    });

    it('shows extensions warning when FCP share is selected and aapl_extensions is disabled', async () => {
      // Manually set the component's smbConfig signal to have aapl_extensions disabled
      await setupTest();

      // Use component's private property to set the config
      (spectator.component as unknown as { smbConfig: { set: (config: SmbConfig) => void } }).smbConfig.set({
        aapl_extensions: false,
      } as SmbConfig);

      await selectPurpose('Final Cut Pro Storage Share');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const warning = spectator.query('ix-smb-extensions-warning');
      expect(warning).toBeTruthy();
    });

    it('does not show aapl_name_mangling checkbox for purposes that do not support it', async () => {
      // Test External Share which doesn't include aapl_name_mangling in its preset
      await setupTest({
        purpose: SmbSharePurpose.ExternalShare,
      } as SmbShare);

      const checkboxes = await getTnCheckboxes('aapl_name_mangling');

      expect(checkboxes).toHaveLength(0);
    });

    it('disables aapl_name_mangling checkbox for FCP purpose', async () => {
      await setupTest();

      // Start with Default Share - checkbox should be enabled
      await selectPurpose('Default Share');
      spectator.detectChanges();
      let checkbox = await getTnCheckbox('aapl_name_mangling');
      expect(await checkbox.isDisabled()).toBe(false);

      // Switch to FCP - checkbox should be checked and disabled
      await selectPurpose('Final Cut Pro Storage Share');
      spectator.detectChanges();
      checkbox = await getTnCheckbox('aapl_name_mangling');
      expect(await checkbox.isChecked()).toBe(true);
      expect(await checkbox.isDisabled()).toBe(true);

      // Switch back to Default - checkbox should be enabled again
      await selectPurpose('Default Share');
      spectator.detectChanges();
      checkbox = await getTnCheckbox('aapl_name_mangling');
      expect(await checkbox.isDisabled()).toBe(false);
    });
  });

  describe('smb form operations (default share)', () => {
    beforeEach(async () => {
      await setupTest();
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');

      await selectPurpose('Default Share');
    });

    it('toggle between Basic/Advanced fields when corresponding buttons are pressed', async () => {
      // Start with advanced options visible because we opened it in beforeEach
      expect(await (await getTnSelect('purpose')).getDisplayText()).toBe('Default Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      expect(pathControl).toBeTruthy();
      expect(await getTnInput('name')).toBeTruthy();
      expect(await getTnInput('comment')).toBeTruthy();
      expect(await getTnCheckbox('enabled')).toBeTruthy();
      expect(await getTnCheckbox('readonly')).toBeTruthy();
      expect(await getTnCheckbox('browsable')).toBeTruthy();
      expect(await getTnCheckbox('access_based_share_enumeration')).toBeTruthy();
      expect(await getTnChipInput('hostsallow')).toBeTruthy();
      expect(await getTnChipInput('hostsdeny')).toBeTruthy();
      expect(await getTnCheckbox('enable')).toBeTruthy();
      expect(await getTnCheckbox('aapl_name_mangling')).toBeTruthy();

      const basicOptions = await loader.getHarness(TnButtonHarness.with({ label: 'Basic Options' }));
      await basicOptions.click();

      // Advanced-only controls are gone after switching to Basic Options.
      expect(await getTnCheckboxes('readonly')).toHaveLength(0);
      expect(await getTnCheckboxes('access_based_share_enumeration')).toHaveLength(0);
      expect(await getTnCheckboxes('aapl_name_mangling')).toHaveLength(0);
      expect(await loader.getAllHarnesses(
        TnChipInputHarness.with({ selector: '[formControlName="hostsallow"]' }),
      )).toHaveLength(0);

      // Basic controls remain.
      expect(await getTnSelect('purpose')).toBeTruthy();
      expect(await getTnInput('name')).toBeTruthy();
      expect(await getTnInput('comment')).toBeTruthy();
      expect(await getTnCheckbox('enabled')).toBeTruthy();
    });

    it('sets the correct options array for purpose field', async () => {
      const purposeSelect = await getTnSelect('purpose');
      await purposeSelect.open();
      const optionLabels = await purposeSelect.getOptions();
      expect(optionLabels).toEqual([
        'Default Share',
        'Time Machine Share',
        'Multi-Protocol Share',
        'Time Locked Share',
        'Private Datasets Share',
        'External Share',
        'Veeam Repository Share',
        'Final Cut Pro Storage Share',
      ]);
    });

    it('should autofill name from path if name is empty', async () => {
      // Verify name is initially empty
      expect(spectator.component.form.controls.name.value).toBeFalsy();
      expect(spectator.component.form.controls.name.dirty).toBeFalsy();

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      // Wait for debounced changes to trigger autofill
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Form control should be updated
      expect(spectator.component.form.controls.name.value).toBe('ds22');
    });

    it('should dispatch', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: false,
        state: ServiceStatus.Stopped,
      } as Service]);
      mockStore$.refreshState();

      await applyCommonValues();
      await clickSave();

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
    });

    it('should change purpose to External when path contains IP address/share format', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await getTnSelect('purpose');

      // Initially should be Default Share
      expect(await purposeControl.getDisplayText()).toBe('Default Share');

      // Set IP address path format
      await pathControl.setValue('192.168.0.200\\SHARE');

      // Wait for debounced changes to trigger
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();

      // Purpose should now be External Share
      expect(await (await getTnSelect('purpose')).getDisplayText()).toBe('External Share');
    });

    it('should change purpose to External when path starts with EXTERNAL prefix', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await getTnSelect('purpose');

      expect(await purposeControl.getDisplayText()).toBe('Default Share');

      await pathControl.setValue('EXTERNAL:192.168.0.200\\SHARE');

      // Wait for debounced changes to trigger
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();

      expect(await (await getTnSelect('purpose')).getDisplayText()).toBe('External Share');
    });

    it('should change purpose to External when path starts with EXTERNAL only', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await getTnSelect('purpose');

      expect(await purposeControl.getDisplayText()).toBe('Default Share');

      await pathControl.setValue('external:');

      // Wait for debounced changes to trigger
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();

      expect(await (await getTnSelect('purpose')).getDisplayText()).toBe('External Share');
    });
  });

  describe('smb validation', () => {
    beforeEach(() => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'sharing.smb.share_precheck') {
          return throwError(() => new ApiCallError({
            data: { reason: '[EEXIST] sharing.smb.share_precheck.name: Share with this name already exists. [EINVAL] sharing.smb.share_precheck: TrueNAS server must be joined to a directory service or have at least one local SMB user before creating an SMB share.' },
          } as JsonRpcError));
        }
        return of(null);
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
    });

    it('should have error for duplicate share name', async () => {
      const nameControl = await getTnInput('name');
      await nameControl.setValue('ds222');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      expect(await nameField.getErrorMessage()).toContain('Share with this name already exists');
    });

    it('should have a component for warning user about missing SMB users', () => {
      const warningComponent = spectator.query(SmbUsersWarningComponent);
      expect(warningComponent).toBeTruthy();
    });
  });

  describe('handle error', () => {
    beforeEach(() => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        switch (method) {
          case 'group.query':
            return of([{ group: 'test' }] as Group[]);
          case 'sharing.smb.update':
          case 'sharing.smb.query':
            return of({ ...existingShare });
          case 'filesystem.stat':
            return of({ acl: true } as FileSystemStat);
          case 'sharing.smb.create':
            return throwError(() => new ApiCallError({
              data: {
                reason: '[EINVAL] sharingsmb_create.afp: Apple SMB2/3 protocol extension support is required by this parameter.',
              },
            } as JsonRpcError));
          default:
            return of(null);
        }
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('calls handleValidationErrors when an error occurs during save', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/ds222');
      await (await getTnInput('name')).setValue('test-share');
      await selectPurpose('Default Share');

      await clickSave();

      // Wait for async operations to complete
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalledWith(
        expect.any(ApiCallError),
        expect.any(FormGroup),
        {},
        'smb-form-toggle-advanced-options',
      );
    });
  });

  describe('External share to Default share transition', () => {
    it('should not show warning when changing from External share to another purpose', async () => {
      // Set up an External share that doesn't support aapl_name_mangling
      await setupTest({
        purpose: SmbSharePurpose.ExternalShare,
        options: { remote_path: ['EXTERNAL:192.168.1.100\\share'] },
      });

      // Change to a share type that supports aapl_name_mangling
      await selectPurpose('Default Share');

      // Wait for the form to update and render the new fields
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Change the aapl_name_mangling value
      const aaplNameManglingCheckbox = await getTnCheckbox('aapl_name_mangling');
      await aaplNameManglingCheckbox.check();

      // Mangle warning should NOT be shown since External shares don't support this field
      // Check that the manglingDialog specifically was not called
      const dialogService = spectator.inject(DialogService);
      const confirmCalls = (dialogService.confirm as jest.Mock).mock.calls as { message: string }[][];

      const manglingDialogCall = confirmCalls.find(
        (call) => call?.[0]?.message === helptextSharingSmb.manglingDialog.message,
      );

      expect(manglingDialogCall).toBeUndefined();
    });
  });


  describe('ACL strip warning scope', () => {
    it('should show ACL strip warning only for Legacy shares', async () => {
      await setupTest({
        purpose: SmbSharePurpose.LegacyShare,
      });

      await selectPurpose('Legacy Share');

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      await pathControl.setValue('/mnt/pool2/ds22');

      // Wait for path change to be processed
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 100);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const aclCheckbox = await getTnCheckbox('acl');
      await aclCheckbox.uncheck();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      });
    });

    it('should not show ACL strip warning for non-Legacy shares', async () => {
      await setupTest({
        purpose: SmbSharePurpose.DefaultShare,
      });

      await selectPurpose('Default Share');

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      await pathControl.setValue('/mnt/pool2/ds22');

      // Default shares don't have ACL checkbox, so this simulates the scenario
      spectator.detectChanges();

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalledWith(
        expect.objectContaining({
          title: helptextSharingSmb.stripACLDialog.title,
        }),
      );
    });
  });

  describe('ACL configuration dialog scope', () => {
    it('should process new shares without errors', async () => {
      await setupTest(); // New share

      // Verify form processes successfully for new shares
      await selectPurpose('Default Share');

      expect(spectator.component.isNew).toBe(true);
    });

    it('should recognize existing shares correctly', async () => {
      await setupTest({
        purpose: SmbSharePurpose.DefaultShare,
      });

      // Verify form recognizes this as an existing share
      await selectPurpose('Default Share');

      expect(spectator.component.isNew).toBe(false);
    });
  });

  describe('Auto quota default value', () => {
    it('should set auto_quota to 0 when Private Datasets purpose is selected', async () => {
      await setupTest();

      await selectPurpose('Private Datasets Share');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      expect(await (await getTnInput('auto_quota')).getNumericValue()).toBe(0);
    });

    it('should not override existing auto_quota value', async () => {
      await setupTest({
        purpose: SmbSharePurpose.PrivateDatasetsShare,
        options: { auto_quota: 50 },
      });

      await selectPurpose('Private Datasets Share');

      expect(await (await getTnInput('auto_quota')).getNumericValue()).toBe(50);
    });
  });

  describe('audit logging validation', () => {
    beforeEach(async () => {
      await setupTest();
    });

    it('should disable save button when audit logging is enabled without groups', async () => {
      // Fill in required fields first
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should see save button disabled due to validation error
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('should enable save button when group is added to watch list', async () => {
      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Add a group to watch list
      const watchListChips = await getTnChipInput('watch_list');
      await watchListChips.addChip('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should enable save button when group is added to ignore list', async () => {
      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Add a group to ignore list
      const ignoreListChips = await getTnChipInput('ignore_list');
      await ignoreListChips.addChip('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should enable save button when audit logging is disabled', async () => {
      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Disable audit logging
      await (await getTnCheckbox('enable')).uncheck();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should display error message when audit logging is enabled without groups', async () => {
      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error message is displayed
      const errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('At least one group must be specified');
    });

    it('should re-validate and show error when group is added then removed (reactivity)', async () => {
      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error is initially displayed
      let errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();

      // Add a group to watch list
      const watchListChips = await getTnChipInput('watch_list');
      await watchListChips.addChip('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error is gone
      errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeFalsy();

      // Remove the group
      await watchListChips.removeChip('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error appears again (validates reactivity)
      errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('At least one group must be specified');
    });

    it('should show error when non-existent group is entered in watch list', async () => {
      // Mock API to return error for non-existent group
      const userService = spectator.inject(UserService);
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(throwError(() => new Error('Group not found')));

      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Manually add a non-existent group using the form control
      const auditGroup = (spectator.component as unknown as { form: FormGroup }).form.controls.audit as FormGroup;
      auditGroup.controls.watch_list.setValue(['nonexistent']);
      auditGroup.controls.watch_list.markAsTouched();
      auditGroup.controls.watch_list.updateValueAndValidity();

      // Wait for async validation and debounce (300ms)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 400);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error message is displayed
      const watchListField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Watch List' }));
      expect(await watchListField.getErrorMessage()).toContain('The following groups do not exist: nonexistent');

      // Verify save button is disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('should show error when non-existent group is entered in ignore list', async () => {
      // Mock API to return error for non-existent group
      const userService = spectator.inject(UserService);
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(throwError(() => new Error('Group not found')));

      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Manually add a non-existent group using the form control
      const auditGroup = (spectator.component as unknown as { form: FormGroup }).form.controls.audit as FormGroup;
      auditGroup.controls.ignore_list.setValue(['nonexistent']);
      auditGroup.controls.ignore_list.markAsTouched();
      auditGroup.controls.ignore_list.updateValueAndValidity();

      // Wait for async validation and debounce (300ms)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 400);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error message is displayed
      const ignoreListField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Ignore List' }));
      expect(await ignoreListField.getErrorMessage()).toContain('The following groups do not exist: nonexistent');

      // Verify save button is disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('should pass validation when all entered groups exist', async () => {
      // Mock API to return success for existing groups
      const userService = spectator.inject(UserService);
      jest.spyOn(userService, 'getGroupByNameCached').mockReturnValue(of({
        id: 1,
        gid: 1000,
        name: 'test',
        group: 'test',
        builtin: false,
      } as Group));

      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Add an existing group
      const auditGroup = (spectator.component as unknown as { form: FormGroup }).form.controls.audit as FormGroup;
      auditGroup.controls.watch_list.setValue(['test']);
      auditGroup.controls.watch_list.markAsTouched();
      auditGroup.controls.watch_list.updateValueAndValidity();

      // Wait for async validation and debounce (300ms)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 400);
      });
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify no error message is displayed
      const errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeFalsy();

      // Verify save button is enabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should disable save button during async validation', async () => {
      // Mock API with a delayed response to catch the PENDING state
      const userService = spectator.inject(UserService) as {
        getGroupByNameCached: jest.Mock;
        isGroupInAutocompleteCache: jest.Mock;
        isGroupCachedAsNonExistent: jest.Mock;
      };
      const delayedObservable$ = new Subject<Group>();

      // Override mock methods to ensure delayed observable is used
      userService.getGroupByNameCached = jest.fn(() => delayedObservable$.asObservable());
      userService.isGroupInAutocompleteCache = jest.fn(() => false);
      userService.isGroupCachedAsNonExistent = jest.fn(() => false);

      // Fill in required fields and enable audit logging
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/test');
      await (await getTnInput('name')).setValue('TestShare');
      await selectPurpose('Default Share');
      await (await getTnCheckbox('enable')).check();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Add a group to trigger async validation
      const auditGroup = (spectator.component as unknown as { form: FormGroup }).form.controls.audit as FormGroup;
      auditGroup.controls.watch_list.setValue(['test']);
      auditGroup.controls.watch_list.markAsTouched();
      auditGroup.controls.watch_list.updateValueAndValidity();

      // Wait for debounce (300ms + buffer)
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 400);
      });
      spectator.detectChanges();

      // Verify save button is disabled while validation is pending
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Complete the async validation
      delayedObservable$.next({
        id: 1,
        gid: 1000,
        name: 'test',
        group: 'test',
        builtin: false,
      } as Group);
      delayedObservable$.complete();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is now enabled
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('Dataset Naming Schema null value', () => {
    it('should allow null value for dataset_naming_schema when auto_dataset_creation is enabled', async () => {
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();

      await spectator.fixture.whenStable();

      // The harness displays null as empty string in the UI
      expect(await (await getTnInput('dataset_naming_schema')).getValue()).toBe('');
    });

    it('should clear dataset_naming_schema when auto_dataset_creation is disabled', async () => {
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();
      await (await getTnInput('dataset_naming_schema')).setValue('test-schema');

      await spectator.fixture.whenStable();

      await (await getTnCheckbox('auto_dataset_creation')).uncheck();

      await spectator.fixture.whenStable();

      // dataset_naming_schema field is hidden once auto_dataset_creation is off.
      expect(await loader.getAllHarnesses(
        TnInputHarness.with({ selector: '[formControlName="dataset_naming_schema"]' }),
      )).toHaveLength(0);
    });

    it('should send null to API when dataset_naming_schema is empty', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeMachineShare,
          name: 'time-machine',
          path: '/mnt/pool/time-machine',
          enabled: true,
          options: expect.objectContaining({
            auto_dataset_creation: true,
            dataset_naming_schema: null,
          }),
        }),
      ]);
    });

    it('should convert empty string to null when user clears the field', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();
      await (await getTnInput('dataset_naming_schema')).setValue('initial-value');

      await spectator.fixture.whenStable();

      // The tn-input harness can't sendKeys an empty string; clear via the control to
      // mirror the user emptying the field (the component converts '' to null on submit).
      spectator.component.form.controls.dataset_naming_schema.setValue('');
      spectator.detectChanges();

      await spectator.fixture.whenStable();

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeMachineShare,
          options: expect.objectContaining({
            dataset_naming_schema: null, // Should be converted to null
          }),
        }),
      ]);
    });

    it('should handle toggling auto_dataset_creation on/off/on correctly', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();
      await (await getTnInput('dataset_naming_schema')).setValue('%u');

      await spectator.fixture.whenStable();

      // Disable auto-creation (should clear the field)
      await (await getTnCheckbox('auto_dataset_creation')).uncheck();

      await spectator.fixture.whenStable();
      expect(await loader.getAllHarnesses(
        TnInputHarness.with({ selector: '[formControlName="dataset_naming_schema"]' }),
      )).toHaveLength(0);

      // Re-enable auto-creation (field should stay null/empty, allowing server defaults)
      await (await getTnCheckbox('auto_dataset_creation')).check();

      await spectator.fixture.whenStable();
      // Field should display as empty, allowing user to leave blank or enter custom value
      expect(await (await getTnInput('dataset_naming_schema')).getValue()).toBe('');

      // User can optionally enter a new value
      await (await getTnInput('dataset_naming_schema')).setValue('custom-schema');

      await spectator.fixture.whenStable();
      expect(await (await getTnInput('dataset_naming_schema')).getValue()).toBe('custom-schema');

      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          options: expect.objectContaining({
            auto_dataset_creation: true,
            dataset_naming_schema: 'custom-schema',
          }),
        }),
      ]);
    });

    it('should send null when toggling auto_dataset_creation and leaving field empty', async () => {
      jest.spyOn(console, 'warn').mockImplementation();
      await setupTest();

      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/time-machine');
      await (await getTnInput('name')).setValue('time-machine');
      await (await getTnCheckbox('auto_dataset_creation')).check();
      await (await getTnInput('dataset_naming_schema')).setValue('%u');

      await spectator.fixture.whenStable();

      // Disable and re-enable auto-creation
      await (await getTnCheckbox('auto_dataset_creation')).uncheck();

      await spectator.fixture.whenStable();

      await (await getTnCheckbox('auto_dataset_creation')).check();

      await spectator.fixture.whenStable();

      // Leave field empty (should send null for server defaults)
      await clickSave();

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          options: expect.objectContaining({
            auto_dataset_creation: true,
            dataset_naming_schema: null, // Should send null for server defaults
          }),
        }),
      ]);
    });
  });

  describe('Submit button behavior with Apple SMB2/3 extensions', () => {
    beforeEach(() => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      mockStore$ = spectator.inject(MockStore);

      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'smb.config') {
          return of({ aapl_extensions: false } as SmbConfig);
        }
        return of(null);
      });
    });

    it('should disable submit button when extensions warning is shown', async () => {
      // Select Time Machine Share (requires Apple SMB2/3 extensions)
      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/timemachine');
      await (await getTnInput('name')).setValue('timemachine');

      // Manually set the smbConfig signal to trigger the warning
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['smbConfig'].set({ aapl_extensions: false } as SmbConfig);
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify warning is shown
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(true);

      // Verify submit button is disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Verify warning component is shown with correct id
      const warningElement = spectator.query('#apple-extensions-warning');
      expect(warningElement).toBeTruthy();
    });

    it('should enable submit button after extensions are enabled', async () => {
      // Select Time Machine Share (requires Apple SMB2/3 extensions)
      await selectPurpose('Time Machine Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/timemachine');
      await (await getTnInput('name')).setValue('timemachine');

      // Set config to show warning
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['smbConfig'].set({ aapl_extensions: false } as SmbConfig);
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify button is disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Enable extensions
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['extensionsEnabled']();
      spectator.detectChanges();

      // Verify warning is gone and button is enabled
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(false);
      expect(await saveButton.isDisabled()).toBe(false);

      // Verify warning component is no longer shown
      const warningElement = spectator.query('#apple-extensions-warning');
      expect(warningElement).toBeFalsy();
    });

    it('should show warning reactively when switching between purposes requiring extensions', async () => {
      // Start with Default Share (no warning)
      await selectPurpose('Default Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool/default');
      await (await getTnInput('name')).setValue('default');

      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['smbConfig'].set({ aapl_extensions: false } as SmbConfig);
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify no warning for Default Share
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(false);
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);

      // Switch to Time Machine Share (warning should appear)
      await selectPurpose('Time Machine Share');
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify warning is shown and button is disabled
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(true);
      expect(await saveButton.isDisabled()).toBe(true);

      // Enable extensions
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['extensionsEnabled']();
      spectator.detectChanges();

      // Verify button is enabled
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(false);
      expect(await saveButton.isDisabled()).toBe(false);

      // Switch to FCP Share (another purpose requiring extensions with extensions disabled)
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['smbConfig'].set({ aapl_extensions: false } as SmbConfig);
      await selectPurpose('Final Cut Pro Storage Share');
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify warning appears again for FCP share
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(true);
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Switch back to Default Share (warning should disappear)
      await selectPurpose('Default Share');
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['updateExtensionsWarning']();
      spectator.detectChanges();

      // Verify warning is gone
      // eslint-disable-next-line @typescript-eslint/dot-notation
      expect(spectator.component['showExtensionsWarning']()).toBe(false);
      expect(await saveButton.isDisabled()).toBe(false);
    });
  });

  describe('grace_period validation', () => {
    beforeEach(async () => {
      await setupTest();
    });

    it('should disable save button when grace_period is below minimum (60)', async () => {
      await selectPurpose('Time Locked Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/locked');
      await (await getTnInput('name')).setValue('locked-share');
      await (await getTnInput('grace_period')).setValue('59');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('should disable save button when grace_period is above maximum (15552000)', async () => {
      await selectPurpose('Time Locked Share');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool123/locked');
      await (await getTnInput('name')).setValue('locked-share');
      await (await getTnInput('grace_period')).setValue('15552001');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });
  });
});
