import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of, throwError } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
import { Service } from 'app/interfaces/service.interface';
import {
  SmbPresetType, smbPresetTypeLabels, SmbShare,
} from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { RestartSmbDialog } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { presetEnabledFields } from 'app/pages/sharing/smb/smb-form/smb-form-presets';
import { ApiCallError } from 'app/services/errors/error.classes';
import { FilesystemService } from 'app/services/filesystem.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { SmbFormComponent } from './smb-form.component';

describe('SmbFormComponent', () => {
  const existingShare = {
    id: 1,
    purpose: 'Legacy Share',
    name: 'ds222',
    path: '/mnt/pool123/ds222',
    path_local: '/mnt/pool123/ds222',
    audit: {
      enable: true,
      watch_list: [] as string[],
      ignore_list: [] as string[],
    },
    options: {
      purpose: 'Legacy Share',
      path_suffix: '%U',
      auxsmbconf: 'Aux SMB Conf',
      home: false,
      comment: '',
      ro: false,
      browsable: true,
      recyclebin: true,
      guestok: true,
      hostsallow: ['host1'],
      hostsdeny: ['host2'],
      aapl_name_mangling: false,
      abe: true,
      acl: false,
      durablehandle: true,
      streams: true,
      timemachine: true,
      shadowcopy: true,
      fsrvp: false,
      enabled: true,
      locked: false,
    },
  } as unknown as SmbShare;

  const slideInRef: SlideInRef<{ existingSmbShare?: SmbShare; defaultSmbShare?: SmbShare } | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const formLabels: Record<string, string> = {
    path: 'Path',
    name: 'Name',
    purpose: 'Purpose',
    comment: 'Description',
    enabled: 'Enabled',
    acl: 'Enable ACL',
    ro: 'Export Read Only',
    browsable: 'Browsable to Network Clients',
    guestok: 'Allow Guest Access',
    abe: 'Access Based Share Enumeration',
    hostsallow: 'Hosts Allow',
    hostsdeny: 'Hosts Deny',
    home: 'Use as Home Share',
    timemachine: 'Time Machine',
    afp: 'Legacy AFP Compatibility',
    shadowcopy: 'Enable Shadow Copies',
    recyclebin: 'Export Recycle Bin',
    aapl_name_mangling: 'Use Apple-style Character Encoding',
    streams: 'Enable Alternate Data Streams',
    durablehandle: 'Enable SMB2/3 Durable Handles',
    fsrvp: 'Enable FSRVP',
    path_suffix: 'Path Suffix',
    auxsmbconf: 'Additional Parameters String',
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
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('group.query', [{ group: 'test' }] as Group[]),
        mockCall('sharing.smb.create', { ...existingShare }),
        mockCall('sharing.smb.update', { ...existingShare }),
        mockCall('sharing.smb.share_precheck', null),
        mockCall('sharing.smb.query', [
          { ...existingShare },
        ]),
        mockCall('filesystem.stat', {
          acl: true,
        } as FileSystemStat),
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
        }],
      }),
      mockProvider(FormErrorHandlerService, {
        handleValidationErrors: jest.fn(),
      }),
    ],
  });

  describe('edit', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ existingSmbShare: { ...existingShare } }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);

      await form.fillForm({
        Purpose: 'Legacy Share',
      });
    });

    it('shows values of existing share when editing', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const values = await form.getValues();

      const existingShareWithLabels: Record<string, unknown> = {};
      Object.keys(existingShare).forEach((key) => {
        if (!formLabels[key]) {
          return;
        }
        existingShareWithLabels[formLabels[key]] = existingShare[key as keyof SmbShare];
      });

      expect(values).toMatchObject(existingShareWithLabels);
    });

    it('should show warning if aaple_name_mangling value changes when editing', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const aaplNameManglingCheckbox = await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.aapl_name_mangling }),
      );

      if (existingShare.aapl_name_mangling) {
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
  });

  describe('smb form operations', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
      mockStore$ = spectator.inject(MockStore);
      store$ = spectator.inject(Store);
      jest.spyOn(store$, 'dispatch');

      await form.fillForm({
        Purpose: 'Legacy Share',
      });
    });

    it('shows all the fields when Advanced Options button is pressed', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const fields = Object.keys(await form.getControlHarnessesDict());

      Object.values(formLabels).forEach((label) => {
        expect(fields).toContain(label);
      });
    });

    it('sets the correct options array for purpose field', async () => {
      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));
      const optionLabels = await purposeSelect.getOptionLabels();
      expect(optionLabels).toEqual([
        'Default Share',
        'Legacy Share',
        'Time Machine Share',
        'Multi-Protocol Share',
        'Time Locked Share',
        'Private Datasets Share',
        'External Share',
      ]);
    });

    it('when a preset is selected, the relevant fields should be impacted', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: formLabels.purpose }));
      const labels = await purposeSelect.getOptionLabels();
      form = await loader.getHarness(IxFormHarness);
      const fields = await form.getControlHarnessesDict();

      for (const label of labels) {
        await purposeSelect.setValue(label);

        const presetKey = Object.entries(smbPresetTypeLabels)
          .find(([, value]) => value === label)?.[0] as SmbPresetType;
        const presetFields = presetEnabledFields[presetKey] ?? [];

        for (const field of presetFields) {
          const controlLabel = formLabels[field];
          const expectedValue = (await form.getControl(field)).getValue();

          const control = fields[controlLabel];
          if (!control) continue;

          const value = await control.getValue();
          expect(value).toStrictEqual(expectedValue);
          expect(await control.isDisabled()).toBeTruthy();
        }
      }
    });

    it('should show confirmation warning when afp is checked', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();
      const afpCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: formLabels.afp }));
      await afpCheckbox.setValue(true);
      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.afpWarningTitle,
        message: helptextSharingSmb.afpWarningMessage,
        hideCheckbox: false,
        buttonText: helptextSharingSmb.afpDialogButton,
        hideCancel: false,
      });
    });

    it('should autofill name from path if name is empty', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const nameControl = await loader.getHarness(IxInputHarness.with({ label: formLabels.name }));
      await nameControl.setValue('');
      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      expect(await nameControl.getValue()).toBe('ds22');

      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      });
    });

    it('should show strip acl warning if acl is trivial when path changes', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const pathControl = await loader.getHarness(IxExplorerHarness.with({ label: formLabels.path }));
      await pathControl.setValue('/mnt/pool2/ds22');

      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));
      await purposeSelect.setValue('Default Share');
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

    it('should show acl warning if acl is unchcekd and dataset is non-trivial', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Purpose' }));
      await purposeSelect.setValue('Private Datasets Share');

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

    it('should submit the form with the correct value', async () => {
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: true,
        state: ServiceStatus.Running,
      } as Service]);
      mockStore$.refreshState();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const attrs: Record<string, unknown> = {};
      Object.keys(existingShare).forEach((key) => {
        if (formLabels[key]) {
          attrs[formLabels[key]] = existingShare[key as keyof SmbShare];
        }
      });

      attrs[formLabels.purpose] = attrs[formLabels.purpose] as string;
      attrs[formLabels.name] = 'ds223';
      attrs[formLabels.hostsallow] = ['host11'];
      attrs[formLabels.hostsdeny] = ['host22'];
      await form.fillForm({
        ...attrs,
      });

      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenNthCalledWith(6, 'sharing.smb.create', [{
        name: 'ds223',
        path: '/mnt/pool123/ds222',
        purpose: 'LEGACY_SHARE',
        comment: '',
        enabled: true,
        ro: false,
        browsable: true,
        abe: false,
        audit: {
          enable: false,
          watch_list: [],
          ignore_list: [],
        },
        options: {
          aapl_name_mangling: false,
          acl: false,
          afp: false,
          auxsmbconf: '',
          durablehandle: false,
          fsrvp: false,
          guestok: false,
          home: false,
          hostsallow: ['host11'],
          hostsdeny: ['host22'],
          path_suffix: '',
          purpose: 'LEGACY_SHARE',
          recyclebin: false,
          shadowcopy: false,
          streams: false,
          timemachine: false,
          timemachine_quota: 0,
          vuid: '',
        },
      }]);

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RestartSmbDialog, {
        data: {
          timemachine: true,
          homeshare: true,
          path: false,
          hosts: true,
          isNew: true,
        },
      });

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        helptextSharingSmb.restartedSmbDialog.message,
      );

      const sharePath = await (await loader.getHarness(
        IxExplorerHarness.with({ label: formLabels.path }),
      )).getValue();

      expect(api.call).toHaveBeenCalledWith('filesystem.stat', [sharePath]);

      const homeShare = await (await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.home }),
      )).getValue();

      expect(spectator.inject(Router).navigate)
        .toHaveBeenCalledWith(
          ['/', 'datasets', 'acl', 'edit'],
          { queryParams: { homeShare, path: sharePath } },
        );
    });

    it('should submit the form with the correct value and check service action is dispatched', async () => {
      mockStore$.overrideSelector(selectServices, [{
        id: 4,
        service: ServiceName.Cifs,
        enable: false,
        state: ServiceStatus.Stopped,
      } as Service]);
      mockStore$.refreshState();

      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const attrs: Record<string, unknown> = {};
      Object.keys(existingShare).forEach((key) => {
        if (formLabels[key]) {
          attrs[formLabels[key]] = existingShare[key as keyof SmbShare];
        }
      });

      attrs[formLabels.purpose] = attrs[formLabels.purpose] as string;
      attrs[formLabels.name] = 'ds223';
      attrs[formLabels.hostsallow] = ['host11'];
      attrs[formLabels.hostsdeny] = ['host22'];
      await form.fillForm({
        ...attrs,
      });

      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.stripACLDialog.title,
        message: helptextSharingSmb.stripACLDialog.message,
        hideCheckbox: true,
        buttonText: helptextSharingSmb.stripACLDialog.button,
        hideCancel: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenNthCalledWith(6, 'sharing.smb.create', [{
        name: 'ds223',
        abe: false,
        path: '/mnt/pool123/ds222',
        purpose: 'LEGACY_SHARE',
        comment: '',
        browsable: true,
        enabled: true,
        ro: false,
        audit: {
          enable: false,
          watch_list: [],
          ignore_list: [],
        },
        options: {
          aapl_name_mangling: false,
          acl: false,
          afp: false,
          auxsmbconf: '',
          durablehandle: false,
          fsrvp: false,
          guestok: false,
          home: false,
          hostsallow: ['host11'],
          hostsdeny: ['host22'],
          path_suffix: '',
          purpose: 'LEGACY_SHARE',
          recyclebin: false,
          shadowcopy: false,
          streams: false,
          timemachine: false,
          timemachine_quota: 0,
          vuid: '',
        },
      }]);

      const sharePath = await (await loader.getHarness(
        IxExplorerHarness.with({ label: formLabels.path }),
      )).getValue();

      expect(api.call).toHaveBeenCalledWith('filesystem.stat', [sharePath]);

      const homeShare = await (await loader.getHarness(
        IxCheckboxHarness.with({ label: formLabels.home }),
      )).getValue();

      expect(spectator.inject(Router).navigate)
        .toHaveBeenCalledWith(
          ['/', 'datasets', 'acl', 'edit'],
          { queryParams: { homeShare, path: sharePath } },
        );

      expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Cifs }));
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

    it('shows SMB users warning when there are no SMB users', () => {
      spectator.component.ngOnInit();
      spectator.detectChanges();

      const warning = spectator.query('.smb-users-warning');
      expect(warning).toBeTruthy();

      expect(warning.textContent).toContain('Looks like you don’t have any users who’ll be able to access this share.');
      expect(warning.textContent).toContain('Create a new user');
      expect(warning.textContent).toContain('Configure Directory Services');
      expect(warning.textContent).toContain('Ignore the error and add users later.');

      const options = spectator.queryAll('ul li');

      options[0].querySelector('a')?.click();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/credentials', 'users']);

      options[1].querySelector('a')?.click();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/credentials', 'directory-services']);
    });

    it('should have error for duplicate share name', async () => {
      const nameControl = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      await nameControl.setValue('ds222');
      expect(await nameControl.getErrorText()).toBe('Share with this name already exists');
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
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const attrs: Record<string, unknown> = {};
      Object.keys(existingShare).forEach((key) => {
        if (formLabels[key]) {
          attrs[formLabels[key]] = existingShare[key as keyof SmbShare];
        }
      });

      attrs[formLabels.purpose] = attrs[formLabels.purpose] as string;
      attrs[formLabels.name] = 'ds223';
      attrs[formLabels.hostsallow] = ['host11'];
      attrs[formLabels.hostsdeny] = ['host22'];
      await form.fillForm({
        ...attrs,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalledWith(
        new ApiCallError({
          data: {
            reason: '[EINVAL] sharingsmb_create.afp: Apple SMB2/3 protocol extension support is required by this parameter.',
          },
        } as JsonRpcError),
        spectator.component.form,
        {},
        'smb-form-toggle-advanced-options',
      );
    });
  });
});
