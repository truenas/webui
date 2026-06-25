import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCheckboxHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('FailoverFormComponent', () => {
  let spectator: Spectator<FailoverFormComponent>;
  let loader: HarnessLoader;

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: FailoverFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('failover.config', {
          id: 3,
          master: true,
          disabled: false,
          timeout: 0,
        } as FailoverConfig),
        mockCall('failover.update'),
        mockCall('failover.sync_to_peer'),
        mockCall('failover.sync_from_peer'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
      }),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows current failover settings', async () => {
    expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
    expect(await (await getCheckbox('master')).isChecked()).toBe(true);
    expect(await (await getInput('timeout')).getValue()).toBe('0');
  });

  it('updates failover settings when form is submitted', async () => {
    await (await getInput('timeout')).setValue('20');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.update', [{
      disabled: false,
      master: true,
      timeout: 20,
    }]);
  });

  it('syncs to peer when Sync To Peer is pressed and confirmed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({
      confirmed: true,
      secondaryCheckbox: true,
    } as DialogWithSecondaryCheckboxResult));

    const syncButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sync To Peer' }));
    await syncButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.sync_to_peer', [{ reboot: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirmDialogs.syncToMessage,
    );
  });

  it('syncs from peer when Sync From Peer is pressed and confirmed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({
      confirmed: true,
      secondaryCheckbox: true,
    } as DialogWithSecondaryCheckboxResult));

    const syncButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sync From Peer' }));
    await syncButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.sync_from_peer');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirmDialogs.syncFromMessage,
    );
  });

  it('warns when Default TrueNAS controller checkbox is ticked off and changes Save button to Save And Failover', async () => {
    await (await getCheckbox('enabled')).uncheck();
    await (await getCheckbox('master')).uncheck();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: helptextSystemFailover.masterDialogTitle,
        message: helptextSystemFailover.masterDialogWarning,
      }),
    );

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save And Failover' }));
    expect(saveButton).toExist();
  });
});
