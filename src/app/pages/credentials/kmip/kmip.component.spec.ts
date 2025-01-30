import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import {
  mockCall, mockJob, mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { KmipComponent } from './kmip.component';

describe('KmipComponent', () => {
  let spectator: Spectator<KmipComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: KmipComponent,
    imports: [
      ReactiveFormsModule,
      WithManageCertificatesLinkComponent,
    ],
    providers: [
      mockApi([
        mockCall('kmip.config', {
          server: 'kmip.truenas.com',
          enabled: false,
          id: 1,
          port: 5696,
          certificate: 1,
          certificate_authority: 1,
          manage_sed_disks: true,
          manage_zfs_keys: false,
        }),
        mockCall('kmip.kmip_sync_pending', false),
        mockCall('kmip.clear_sync_pending_keys'),
        mockCall('kmip.sync_keys'),
        mockCall('system.advanced.sed_global_password_is_set', false),
        mockJob('kmip.update'),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(SystemGeneralService, {
        getCertificates: () => of([
          { id: 1, name: 'Main Certificate' },
          { id: 2, name: 'Secondary Certificate' },
        ]),
        getCertificateAuthorities: () => of([
          { id: 1, name: 'Main Authority' },
          { id: 2, name: 'Secondary Authority' },
        ]),
      }),
      mockAuth(),
      provideMockStore({
        selectors: [{
          selector: selectIsEnterprise,
          value: true,
        }],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current KMIP config and shows it in the form', async () => {
    const values = await form.getValues();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.config');
    expect(values).toEqual({
      Server: 'kmip.truenas.com',
      Port: '5696',
      Certificate: 'Main Certificate',
      'Certificate Authority': 'Main Authority',

      'Manage SED Passwords': true,
      'Manage ZFS Keys': false,
      Enabled: false,
      'Change Server': false,
      'Validate Connection': false,
      'Force Clear': false,
    });
  });

  it('saves updated KMIP config when form is submitted', async () => {
    await form.fillForm({
      Server: 'newkmip.truenas.com',
      Port: 5697,
      Certificate: 'Secondary Certificate',
      'Certificate Authority': 'Secondary Authority',
      'Manage ZFS Keys': true,
      'Validate Connection': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'kmip.update',
      [{
        port: 5697,
        server: 'newkmip.truenas.com',
        certificate: 2,
        certificate_authority: 2,

        manage_sed_disks: true,
        manage_zfs_keys: true,
        enabled: false,
        validate: true,
        change_server: false,
        force_clear: false,
      }],
    );
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      'Settings saved.',
    );
  });

  it('checks whether KMIP sync is pending and shows KMIP status', () => {
    const statusText = spectator.query('.key-status')!;

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.kmip_sync_pending');
    expect(statusText.textContent).toContain('Disabled');
  });

  describe('pending sync', () => {
    beforeEach(() => {
      spectator.inject(MockApiService).mockCall('kmip.kmip_sync_pending', true);
      spectator.component.ngOnInit();
    });

    it('enables Sync Keys and Clear Sync Keys when there is a pending KMIP sync', async () => {
      const syncKeysButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync Keys' }));
      const clearSyncKeysButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Sync Keys' }));

      expect(await syncKeysButton.isDisabled()).toBe(false);
      expect(await clearSyncKeysButton.isDisabled()).toBe(false);
    });

    it('syncs keys when Sync Keys button is pressed', async () => {
      const syncKeysButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync Keys' }));
      await syncKeysButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.sync_keys');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        helptextSystemKmip.syncInfoDialog.title,
        helptextSystemKmip.syncInfoDialog.info,
      );
    });

    it('clears sync keys when Clear Sync Keys is pressed', async () => {
      const clearSyncKeysButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Sync Keys' }));
      await clearSyncKeysButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.clear_sync_pending_keys');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        helptextSystemKmip.clearSyncKeyInfoDialog.title,
        helptextSystemKmip.clearSyncKeyInfoDialog.info,
      );
    });
  });

  it('checks no "Manage SED Passwords" checkbox are present when community edition', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsEnterprise, false);
    store$.refreshState();

    const checkboxes = await loader.getAllHarnesses(IxCheckboxHarness);
    const checkLabels = await parallel(() => checkboxes.map((control) => control.getLabelText()));

    expect(checkLabels.find((label) => label === 'Manage SED Passwords')).not.toExist();
  });
});
