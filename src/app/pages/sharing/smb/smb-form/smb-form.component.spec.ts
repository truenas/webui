import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
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
  LegacySmbShareOptions,
  SmbSharePurpose,
  SmbShare,
} from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxChipsHarness } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { WarningHarness } from 'app/modules/forms/ix-forms/components/warning/warning.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { RestartSmbDialog } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { SmbUsersWarningComponent } from 'app/pages/sharing/smb/smb-form/smb-users-warning/smb-users-warning.component';
import { ApiCallError } from 'app/services/errors/error.classes';
import { FilesystemService } from 'app/services/filesystem.service';
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
    name: 'Name',
    purpose: 'Purpose',
    comment: 'Description',
    enabled: 'Enabled',
    ro: 'Export Read Only',
    browsable: 'Browsable to Network Clients',
    abe: 'Access Based Share Enumeration',
    aapl_name_mangling: 'Use Apple-style Character Encoding',
    watch_list: 'Watch List',
    ignore_list: 'Ignore List',
  };

  let spectator: Spectator<SmbFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;
  let mockStore$: MockStore<AppState>;
  let store$: Store<AppState>;

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
      mockProvider(SlideIn),
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
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
    form = await loader.getHarness(IxFormHarness);
    api = spectator.inject(ApiService);

    const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedButton.click();
  }

  const commonValues = {
    Path: '/mnt/pool123/ds222',
    Name: 'Default',
    Description: 'Description',
    Enabled: true,
    'Export Read Only': true,
    'Browsable to Network Clients': true,
    'Access Based Share Enumeration': true,
    'Enable Logging': false,
  };

  async function submitForm(values: Record<string, unknown>): Promise<void> {
    await form.fillForm(values);
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
  }

  describe('legacy share', () => {
    beforeEach(async () => {
      await setupTest({ purpose: SmbSharePurpose.LegacyShare });

      await form.fillForm({
        Purpose: 'Legacy Share',
      });
    });

    it('should show confirmation warning when afp is checked', async () => {
      const afpCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Legacy AFP Compatibility' }));
      await afpCheckbox.setValue(true);
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

    it('should show restart dialog when save is clicked under certain conditions', async () => {
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: true,
        state: ServiceStatus.Running,
      } as Service]);

      await form.fillForm({
        Path: '/mnt/pool123/new',
        'Time Machine': false,
        'Hosts Allow': 'host1',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RestartSmbDialog, {
        data: {
          timemachine: false,
          homeshare: false,
          path: true,
          hosts: true,
          isNew: false,
        },
      });

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        helptextSharingSmb.restartedSmbDialog.message,
      );
    });

    it('should show strip acl warning if acl is trivial when path changes', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      const aclCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: formLabels.acl }));
      await (await aclCheckbox.getMatCheckboxHarness()).uncheck();

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
    });

    it('creates default share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'Default Share',
        'Use Apple-style Character Encoding': true,
      });

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
        },
      }]);
    });

    it('creates time machine share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'Time Machine Share',
        'Time Machine Quota': '10G',
        VUID: '08e00781-18ac-4c6c-bfeb-9c1c504ea0d7',
        'Auto Snapshot': true,
        'Auto Dataset Creation': true,
        'Dataset Naming Schema': '%u',
      });

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeMachineShare,
          options: {
            timemachine_quota: 10 * GiB,
            vuid: '08e00781-18ac-4c6c-bfeb-9c1c504ea0d7',
            auto_snapshot: true,
            auto_dataset_creation: true,
            dataset_naming_schema: '%u',
          },
        }),
      ]);
    });

    it('creates Multi-Protocol share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'Multi-Protocol Share',
        'Use Apple-style Character Encoding': true,
      });

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.MultiProtocolShare,
          options: {
            aapl_name_mangling: true,
          },
        }),
      ]);
    });

    it('creates Time Locked share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'Time Locked Share',
        'Grace Period': 5,
        'Use Apple-style Character Encoding': true,
      });

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.TimeLockedShare,
          options: {
            grace_period: 5,
            aapl_name_mangling: true,
          },
        }),
      ]);
    });

    it('creates Private Datasets share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'Private Datasets Share',
        'Dataset Naming Schema': '%u',
        'Auto Quota': 20,
        'Use Apple-style Character Encoding': true,
      });

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.PrivateDatasetsShare,
          options: {
            dataset_naming_schema: '%u',
            auto_quota: 20,
            aapl_name_mangling: true,
          },
        }),
      ]);
    });

    it('creates External share', async () => {
      await submitForm({
        ...commonValues,
        Purpose: 'External Share',
        'Remote Paths': ['192.168.0.1\\SHARE'],
      });

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
      await submitForm({
        ...commonValues,
        Purpose: 'Veeam Repository Share',
      });

      expect(api.call).toHaveBeenLastCalledWith('sharing.smb.create', [
        expect.objectContaining({
          purpose: SmbSharePurpose.VeeamRepositoryShare,
          options: {},
        }),
      ]);
    });
  });

  describe('edit default share', () => {
    beforeEach(async () => {
      await setupTest({ purpose: SmbSharePurpose.DefaultShare });

      await form.fillForm({
        Purpose: 'Default Share',
      });
    });

    it('shows values of existing share when editing', async () => {
      expect(await form.getValues()).toEqual({
        Path: '/mnt/pool123/ds222',
        Name: 'ds222',
        Purpose: 'Default Share',
        Description: 'Description',
        Enabled: true,

        'Export Read Only': true,
        'Browsable to Network Clients': true,
        'Access Based Share Enumeration': true,
        'Enable Logging': false,

        'Use Apple-style Character Encoding': true,
      });
    });

    it('should show warning if aaple_name_mangling value changes when editing', async () => {
      const aaplNameManglingCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.aapl_name_mangling }),
      );

      if ((existingShare.options as LegacySmbShareOptions).aapl_name_mangling) {
        await aaplNameManglingCheckbox.setValue(false);
      } else {
        await aaplNameManglingCheckbox.setValue(true);
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
      const aaplNameManglingCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.aapl_name_mangling }),
      );

      await aaplNameManglingCheckbox.setValue(
        (existingShare.options as LegacySmbShareOptions).aapl_name_mangling,
      );

      expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
    });
  });

  describe('smb form operations (default share)', () => {
    beforeEach(async () => {
      await setupTest();
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');

      await form.fillForm({
        Purpose: 'Default Share',
      });
    });

    it('toggle between Basic/Advanced fields when corresponding buttons are pressed', async () => {
      // Start with advanced options visible because we opened it in beforeEach
      expect(await form.getLabels()).toEqual([
        'Purpose',
        'Path',
        'Name',
        'Description',
        'Enabled',
        'Export Read Only',
        'Browsable to Network Clients',
        'Access Based Share Enumeration',
        'Enable Logging',
        'Use Apple-style Character Encoding',
      ]);

      const basicOptions = await loader.getHarness(MatButtonHarness.with({ text: 'Basic Options' }));
      await basicOptions.click();

      expect(await form.getLabels()).toEqual([
        'Purpose',
        'Path',
        'Name',
        'Description',
        'Enabled',
      ]);
    });

    it('sets the correct options array for purpose field', async () => {
      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));
      const optionLabels = await purposeSelect.getOptionLabels();
      expect(optionLabels).toEqual([
        'Default Share',
        'Time Machine Share',
        'Multi-Protocol Share',
        'Time Locked Share',
        'Private Datasets Share',
        'External Share',
        'Veeam Repository Share',
      ]);
    });

    it('should autofill name from path if name is empty', async () => {
      const nameControl = await loader.getHarness(IxInputHarness.with({ label: formLabels.name }));
      await nameControl.setValue('');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      expect(await nameControl.getValue()).toBe('ds22');
    });

    it('should dispatch', async () => {
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: false,
        state: ServiceStatus.Stopped,
      } as Service]);
      mockStore$.refreshState();

      await submitForm(commonValues);

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
    });

    it('should change purpose to External when path contains IP address/share format', fakeAsync(async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));

      // Initially should be Default Share
      expect(await purposeControl.getValue()).toBe('Default Share');

      // Set IP address path format
      await pathControl.setValue('192.168.0.200\\SHARE');

      // Wait for debounced changes to trigger
      tick(100);
      spectator.detectChanges();

      // Purpose should now be External Share
      expect(await purposeControl.getValue()).toBe('External Share');
    }));

    it('should change purpose to External when path starts with EXTERNAL prefix', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));

      expect(await purposeControl.getValue()).toBe('Default Share');

      await pathControl.setValue('EXTERNAL:192.168.0.200\\SHARE');
      spectator.detectChanges();

      expect(await purposeControl.getValue()).toBe('External Share');
    });

    it('should change purpose to External when path starts with EXTERNAL only', async () => {
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      const purposeControl = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));

      expect(await purposeControl.getValue()).toBe('Default Share');

      await pathControl.setValue('external:');
      spectator.detectChanges();

      expect(await purposeControl.getValue()).toBe('External Share');
    });
  });

  describe('smb validation', () => {
    beforeEach(async () => {
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
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');
    });

    it('should have error for duplicate share name', async () => {
      const nameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameControl.setValue('ds222');
      expect(await nameControl.getErrorText()).toBe('Share with this name already exists');
    });

    it('should have a component for warning user about missing SMB users', () => {
      const warningComponent = spectator.query(SmbUsersWarningComponent);
      expect(warningComponent).toBeTruthy();
    });
  });

  describe('handle error', () => {
    beforeEach(async () => {
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
      form = await loader.getHarness(IxFormHarness);
    });

    it('calls handleValidationErrors when an error occurs during save', async () => {
      await submitForm({
        Path: '/mnt/pool123/ds222',
      });

      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalledWith(
        new ApiCallError({
          data: {
            reason: '[EINVAL] sharingsmb_create.afp: Apple SMB2/3 protocol extension support is required by this parameter.',
          },
        } as JsonRpcError),
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
      await form.fillForm({
        Purpose: 'Default Share',
      });

      // Wait for the form to update and render the new fields
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Change the aapl_name_mangling value
      const aaplNameManglingCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.aapl_name_mangling }),
      );
      await aaplNameManglingCheckbox.setValue(true);

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

  describe('Time Machine share detection improvements', () => {
    it('should detect new Time Machine share by purpose', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Time Machine Share',
      });

      expect(spectator.component.isNewTimeMachineShare).toBe(true);
    });

    it('should detect new Time Machine share by field when purpose supports it', async () => {
      await setupTest({
        purpose: SmbSharePurpose.LegacyShare,
      });

      await form.fillForm({
        Purpose: 'Legacy Share',
        'Time Machine': true,
      });

      expect(spectator.component.isNewTimeMachineShare).toBe(true);
    });

    it('should not detect Time Machine for non-supporting purpose', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Default Share',
      });

      expect(spectator.component.isNewTimeMachineShare).toBe(false);
    });

    it('should detect change in Time Machine functionality for existing share', async () => {
      const spectator2 = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              existingSmbShare: {
                ...existingShare,
                purpose: SmbSharePurpose.LegacyShare,
                options: { timemachine: false } as LegacySmbShareOptions,
              },
            }),
          }),
        ],
      });
      const loader2 = TestbedHarnessEnvironment.loader(spectator2.fixture);
      const form2 = await loader2.getHarness(IxFormHarness);

      const advancedButton = await loader2.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      await form2.fillForm({
        Purpose: 'Time Machine Share',
      });

      expect(spectator2.component.isNewTimeMachineShare).toBe(true);
    });
  });

  describe('Path change detection with trailing slashes', () => {
    it('should normalize trailing slashes when detecting path changes', async () => {
      await setupTest({
        path: '/mnt/pool123/ds222/',
      });

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));

      // Set path without trailing slash - should not be considered a change
      await pathControl.setValue('/mnt/pool123/ds222');
      expect(spectator.component.wasPathChanged).toBe(false);

      // Set different path - should be considered a change
      await pathControl.setValue('/mnt/pool123/ds223');
      expect(spectator.component.wasPathChanged).toBe(true);

      // Set same path with trailing slash - should not be considered a change
      await pathControl.setValue('/mnt/pool123/ds222/');
      expect(spectator.component.wasPathChanged).toBe(false);
    });

    it('should handle empty paths correctly', async () => {
      await setupTest(); // No existing share

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      await pathControl.setValue('/mnt/pool123/new');

      expect(spectator.component.wasPathChanged).toBe(false);
    });
  });

  describe('ACL strip warning scope', () => {
    it('should show ACL strip warning only for Legacy shares', async () => {
      await setupTest({
        purpose: SmbSharePurpose.LegacyShare,
      });

      await form.fillForm({
        Purpose: 'Legacy Share',
      });

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: 'Path' }));
      await pathControl.setValue('/mnt/pool2/ds22');

      const aclCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable ACL' }));
      await (await aclCheckbox.getMatCheckboxHarness()).uncheck();

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

      await form.fillForm({
        Purpose: 'Default Share',
      });

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
      await form.fillForm({
        Purpose: 'Default Share',
      });

      expect(spectator.component.isNew).toBe(true);
    });

    it('should recognize existing shares correctly', async () => {
      await setupTest({
        purpose: SmbSharePurpose.DefaultShare,
      });

      // Verify form recognizes this as an existing share
      await form.fillForm({
        Purpose: 'Default Share',
      });

      expect(spectator.component.isNew).toBe(false);
    });
  });

  describe('Auto quota default value', () => {
    it('should set auto_quota to 0 when Private Datasets purpose is selected', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Private Datasets Share',
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const formValues = await form.getValues();
      expect(formValues['Auto Quota']).toBe('0');
    });

    it('should not override existing auto_quota value', async () => {
      await setupTest({
        purpose: SmbSharePurpose.PrivateDatasetsShare,
        options: { auto_quota: 50 },
      });

      await form.fillForm({
        Purpose: 'Private Datasets Share',
      });

      const formValues = await form.getValues();
      expect(formValues['Auto Quota']).toBe('50');
    });
  });

  describe('audit logging validation', () => {
    beforeEach(async () => {
      await setupTest();
    });

    it('should disable save button when audit logging is enabled without groups', async () => {
      // Fill in required fields first
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should see save button disabled due to validation error
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('should enable save button when group is added to watch list', async () => {
      // Fill in required fields and enable audit logging
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Add a group to watch list
      const watchListChips = await loader.getHarness(IxChipsHarness.with({ label: 'Watch List' }));
      await watchListChips.selectSuggestionValue('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should enable save button when group is added to ignore list', async () => {
      // Fill in required fields and enable audit logging
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Add a group to ignore list
      const ignoreListChips = await loader.getHarness(IxChipsHarness.with({ label: 'Ignore List' }));
      await ignoreListChips.selectSuggestionValue('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should enable save button when audit logging is disabled', async () => {
      // Fill in required fields and enable audit logging
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify save button is initially disabled
      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Disable audit logging
      const enableLoggingCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: 'Enable Logging' }));
      await enableLoggingCheckbox.setValue(false);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User should now see save button enabled
      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(false);
    });

    it('should display error message when audit logging is enabled without groups', async () => {
      // Fill in required fields and enable audit logging
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error message is displayed
      const errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('At least one group must be specified');
    });

    it('should re-validate and show error when group is added then removed (reactivity)', async () => {
      // Fill in required fields and enable audit logging
      await form.fillForm({
        Path: '/mnt/pool123/test',
        Name: 'TestShare',
        Purpose: 'Default Share',
        'Enable Logging': true,
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error is initially displayed
      let errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();

      // Add a group to watch list
      const watchListChips = await loader.getHarness(IxChipsHarness.with({ label: 'Watch List' }));
      await watchListChips.selectSuggestionValue('test');

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error is gone
      errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeFalsy();

      // Remove the group
      await watchListChips.removeAllChips();

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify error appears again (validates reactivity)
      errorElement = spectator.query('ix-errors mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('At least one group must be specified');
    });
  });

  describe('Dataset Naming Schema null value', () => {
    it('should allow null value for dataset_naming_schema when auto_dataset_creation is enabled', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Time Machine Share',
        Path: '/mnt/pool/time-machine',
        Name: 'time-machine',
        'Auto Dataset Creation': true,
        'Dataset Naming Schema': null,
      });

      await spectator.fixture.whenStable();

      const formValues = await form.getValues();
      expect(formValues['Dataset Naming Schema']).toBe('');
    });

    it('should clear dataset_naming_schema when auto_dataset_creation is disabled', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Time Machine Share',
        Path: '/mnt/pool/time-machine',
        Name: 'time-machine',
        'Auto Dataset Creation': true,
        'Dataset Naming Schema': 'test-schema',
      });

      await spectator.fixture.whenStable();

      await form.fillForm({
        'Auto Dataset Creation': false,
      });

      await spectator.fixture.whenStable();

      const formValues = await form.getValues();
      expect(formValues['Dataset Naming Schema']).toBeUndefined();
    });

    it('should send null to API when dataset_naming_schema is empty', async () => {
      await setupTest();

      await form.fillForm({
        Purpose: 'Time Machine Share',
        Path: '/mnt/pool/time-machine',
        Name: 'time-machine',
        'Auto Dataset Creation': true,
        'Dataset Naming Schema': null,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

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
  });
});
