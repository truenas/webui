import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { KmipComponent } from './kmip.component';

describe('KmipComponent', () => {
  let spectator: Spectator<KmipComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: KmipComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
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
        mockJob('kmip.update'),
      ]),
      mockProvider(MatDialog, {
        open: () => mockEntityJobComponentRef,
      }),
      mockProvider(DialogService),
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
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads current KMIP config and shows it in the form', async () => {
    const values = await form.getValues();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('kmip.config');
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

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith(
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
    const statusText = spectator.query('.key-status');

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('kmip.kmip_sync_pending');
    expect(statusText.textContent).toContain('Disabled');
  });

  describe('pending sync', () => {
    beforeEach(() => {
      spectator.inject(MockWebsocketService).mockCall('kmip.kmip_sync_pending', true);
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

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('kmip.sync_keys');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        helptextSystemKmip.syncInfoDialog.title,
        helptextSystemKmip.syncInfoDialog.info,
      );
    });

    it('clears sync keys when Clear Sync Keys is pressed', async () => {
      const clearSyncKeysButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear Sync Keys' }));
      await clearSyncKeysButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('kmip.clear_sync_pending_keys');
      expect(spectator.inject(DialogService).info).toHaveBeenCalledWith(
        helptextSystemKmip.clearSyncKeyInfoDialog.title,
        helptextSystemKmip.clearSyncKeyInfoDialog.info,
      );
    });
  });
});
