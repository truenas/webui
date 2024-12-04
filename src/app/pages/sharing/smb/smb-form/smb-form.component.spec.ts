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
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextSharingSmb } from 'app/helptext/sharing';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { Group } from 'app/interfaces/group.interface';
import { Service } from 'app/interfaces/service.interface';
import { SmbPresets, SmbPresetType, SmbShare } from 'app/interfaces/smb-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RestartSmbDialogComponent } from 'app/pages/sharing/smb/smb-form/restart-smb-dialog/restart-smb-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { SmbFormComponent } from './smb-form.component';

describe('SmbFormComponent', () => {
  const existingShare = {
    id: 1,
    purpose: SmbPresetType.MultiUserTimeMachine,
    path: '/mnt/pool123/ds222',
    path_suffix: '%U',
    auxsmbconf: 'Aux SMB Conf',
    home: false,
    name: 'ds222',
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
    cluster_volname: '',
    locked: false,
    path_local: '/mnt/pool123/ds222',
    audit: {
      enable: true,
      watch_list: [],
      ignore_list: [],
    },
  } as SmbShare;

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

  const presets: SmbPresets = {
    NO_PRESET: {
      verbose_name: 'No presets',
      cluster: false,
      params: {},
    },
    ENHANCED_TIMEMACHINE: {
      verbose_name: 'Multi-user time machine',
      cluster: false,
      params: {
        auxsmbconf: 'Aux SMB Conf',
        path_suffix: '%U',
        timemachine: true,
      },
    },
    PRIVATE_DATASETS: {
      verbose_name: 'Private SMB Datasets and Shares',
      cluster: false,
      params: {
        auxsmbconf: 'Aux SMB Conf',
        path_suffix: '%U',
      },
    },
    CLUSTER_PRESET: {
      verbose_name: 'This will not be shown',
      cluster: true,
      params: {},
    },
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
        mockCall('service.restart'),
        mockCall('sharing.smb.presets', { ...presets }),
      ]),
      mockProvider(SlideInService),
      mockProvider(Router),
      mockProvider(AppLoaderService),
      mockProvider(FilesystemService),
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
      mockProvider(SlideInRef),
      provideMockStore({
        selectors: [{
          selector: selectServices,
          value: [],
        }],
      }),
      mockProvider(FormErrorHandlerService, {
        handleValidationErrors: jest.fn(),
      }),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('edit', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: { existingSmbShare: existingShare } },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
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

      existingShareWithLabels[formLabels.purpose] = (
        presets[existingShareWithLabels[formLabels.purpose] as string].verbose_name
      );
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
      expect(spectator.inject(DialogService).confirm).toHaveBeenNthCalledWith(2, {
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
        'No presets',
        'Multi-user time machine',
        'Private SMB Datasets and Shares',
      ]);
    });

    it('when a preset is selected, the relevant fields should be impacted', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();

      const purposeSelect = await loader.getHarness(IxSelectHarness.with({ label: formLabels.purpose }));

      const labels = await purposeSelect.getOptionLabels();
      const presetKeys = Object.keys(presets);
      form = await loader.getHarness(IxFormHarness);
      const fields = await form.getControlHarnessesDict();

      for (let i = 0; i < labels.length; i++) {
        await purposeSelect.setValue(labels[i]);
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const param in presets[presetKeys[i]].params) {
          const expectedValue = presets[presetKeys[i]].params[param as keyof SmbShare];
          const value = await fields[formLabels[param]].getValue();
          expect(value).toStrictEqual(expectedValue);
          expect(await fields[formLabels[param]].isDisabled()).toBeTruthy();
        }
      }
      expect(true).toBeTruthy();
    });

    it('should show confirmation warning when afp is checked', async () => {
      const advancedButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
      await advancedButton.click();
      const afpCheckbox = await loader.getHarness(IxCheckboxHarness.with({ label: formLabels.afp }));
      await afpCheckbox.setValue(true);
      expect(spectator.inject(DialogService).confirm).toHaveBeenLastCalledWith({
        title: helptextSharingSmb.afpDialog_title,
        message: helptextSharingSmb.afpDialog_message,
        hideCheckbox: false,
        buttonText: helptextSharingSmb.afpDialog_button,
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
      await purposeSelect.setValue(presets.NO_PRESET.verbose_name);
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
      await purposeSelect.setValue(presets.PRIVATE_DATASETS.verbose_name);

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

      attrs[formLabels.purpose] = presets[attrs[formLabels.purpose] as string].verbose_name;
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

      expect(api.call).toHaveBeenCalledWith('sharing.smb.create', [{
        path: '/mnt/pool123/ds222',
        name: 'ds223',
        purpose: SmbPresetType.MultiUserTimeMachine,
        comment: '',
        enabled: true,
        acl: false,
        ro: false,
        browsable: true,
        guestok: true,
        abe: true,
        hostsallow: ['host11'],
        hostsdeny: ['host22'],
        home: false,
        afp: false,
        shadowcopy: true,
        recyclebin: true,
        aapl_name_mangling: false,
        streams: true,
        durablehandle: true,
        fsrvp: false,
        timemachine_quota: 0,
        audit: {
          enable: true,
          watch_list: [],
          ignore_list: [],
        },
      }]);

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(RestartSmbDialogComponent, {
        data: {
          timemachine: true,
          homeshare: true,
          path: false,
          hosts: true,
          isNew: true,
        },
      });

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
        helptextSharingSmb.restarted_smb_dialog.message,
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

      attrs[formLabels.purpose] = presets[attrs[formLabels.purpose] as string].verbose_name;
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

      expect(api.call).toHaveBeenCalledWith('sharing.smb.create', [{
        path: '/mnt/pool123/ds222',
        name: 'ds223',
        purpose: SmbPresetType.MultiUserTimeMachine,
        comment: '',
        enabled: true,
        acl: false,
        ro: false,
        browsable: true,
        guestok: true,
        abe: true,
        hostsallow: ['host11'],
        hostsdeny: ['host22'],
        home: false,
        afp: false,
        shadowcopy: true,
        recyclebin: true,
        aapl_name_mangling: false,
        streams: true,
        durablehandle: true,
        fsrvp: false,
        timemachine_quota: 0,
        audit: {
          enable: true,
          watch_list: [],
          ignore_list: [],
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
          return throwError(() => ({
            jsonrpc: '2.0',
            error: {
              data: { reason: '[EEXIST] sharing.smb.share_precheck.name: Share with this name already exists.' },
            },
          }));
        }
        return null;
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
          case 'sharing.smb.presets':
            return of({ ...presets });
          case 'sharing.smb.create':
            return throwError(() => ({
              error: {
                data: {
                  reason: '[EINVAL] sharingsmb_create.afp: Apple SMB2/3 protocol extension support is required by this parameter.',
                },
              },
            }));
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

      attrs[formLabels.purpose] = presets[attrs[formLabels.purpose] as string].verbose_name;
      attrs[formLabels.name] = 'ds223';
      attrs[formLabels.hostsallow] = ['host11'];
      attrs[formLabels.hostsdeny] = ['host22'];
      await form.fillForm({
        ...attrs,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors).toHaveBeenCalledWith(
        {
          error: {
            data: {
              reason: '[EINVAL] sharingsmb_create.afp: Apple SMB2/3 protocol extension support is required by this parameter.',
            },
          },
        },
        spectator.component.form,
        {},
        'smb-form-toggle-advanced-options',
      );
    });
  });
});
