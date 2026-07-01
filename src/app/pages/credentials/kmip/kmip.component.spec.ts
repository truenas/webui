import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import {
  mockCall, mockJob, mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { KmipComponent } from './kmip.component';

describe('KmipComponent', () => {
  let spectator: Spectator<KmipComponent>;
  let loader: HarnessLoader;
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

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current KMIP config and shows it in the form', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.config');

    const serverInput = await loader.getHarness(TnInputHarness.with({ name: 'server' }));
    const portInput = await loader.getHarness(TnInputHarness.with({ name: 'port' }));
    const certificateSelect = await loader.getHarness(TnSelectHarness);

    expect(await serverInput.getValue()).toBe('kmip.truenas.com');
    expect(await portInput.getValue()).toBe('5696');
    expect(await certificateSelect.getDisplayText()).toBe('Main Certificate');

    const sedManage = await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage SED Passwords' }));
    const zfsKeys = await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage ZFS Keys' }));
    const enabled = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enabled' }));

    expect(await sedManage.isChecked()).toBe(true);
    expect(await zfsKeys.isChecked()).toBe(false);
    expect(await enabled.isChecked()).toBe(false);
  });

  it('saves updated KMIP config when form is submitted', async () => {
    const serverInput = await loader.getHarness(TnInputHarness.with({ name: 'server' }));
    await serverInput.setValue('newkmip.truenas.com');

    const portInput = await loader.getHarness(TnInputHarness.with({ name: 'port' }));
    await portInput.setValue('5697');

    const certificateSelect = await loader.getHarness(TnSelectHarness);
    await certificateSelect.selectOption('Secondary Certificate');

    const zfsKeys = await loader.getHarness(TnCheckboxHarness.with({ label: 'Manage ZFS Keys' }));
    await zfsKeys.check();

    const validate = await loader.getHarness(TnCheckboxHarness.with({ label: 'Validate Connection' }));
    await validate.check();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'kmip.update',
      [{
        port: 5697,
        server: 'newkmip.truenas.com',
        certificate: 2,

        manage_sed_disks: true,
        manage_zfs_keys: true,
        enabled: false,
        validate: true,
        change_server: false,
        force_clear: false,
      }],
    );

    // Guard against the Number input regressing to a string payload (ix-input type="number" used to coerce this).
    const [, [payload]] = jest.mocked(spectator.inject(ApiService).job).mock.calls[0];
    expect(typeof payload.port).toBe('number');
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
      const syncKeysButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sync Keys' }));
      const clearSyncKeysButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clear Sync Keys' }));

      expect(await syncKeysButton.isDisabled()).toBe(false);
      expect(await clearSyncKeysButton.isDisabled()).toBe(false);
    });

    it('syncs keys when Sync Keys button is pressed', async () => {
      const syncKeysButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sync Keys' }));
      await syncKeysButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kmip.sync_keys');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        helptextSystemKmip.syncInfoDialog.title,
        helptextSystemKmip.syncInfoDialog.info,
      );
    });

    it('clears sync keys when Clear Sync Keys is pressed', async () => {
      const clearSyncKeysButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clear Sync Keys' }));
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
    spectator.detectChanges();

    const hasSedManage = await loader.hasHarness(TnCheckboxHarness.with({ label: 'Manage SED Passwords' }));

    expect(hasSedManage).toBe(false);
  });
});
