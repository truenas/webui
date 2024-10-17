import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { FailoverSettingsComponent } from 'app/pages/system/failover-settings/failover-settings.component';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';

describe('FailoverComponent', () => {
  let spectator: Spectator<FailoverSettingsComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: FailoverSettingsComponent,
    imports: [
      ReactiveFormsModule,
      SearchInput1Component,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('failover.update'),
        mockCall('failover.sync_to_peer'),
        mockCall('failover.sync_from_peer'),
        mockCall('failover.config', {
          id: 3,
          master: true,
          disabled: false,
          timeout: 0,
        }),
      ]),
      mockProvider(SnackbarService),
      mockProvider(WebSocketConnectionService, {
        isConnected$: of(true),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    jest.spyOn(spectator.inject(DialogService), 'confirm');
  });

  it('loads and shows current failover settings', async () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.config');
    expect(await form.getValues()).toEqual({
      'Disable Failover': false,
      'Default TrueNAS controller': true,
      'Network Timeout Before Initiating Failover': '0',
    });
  });

  it('updates failover settings when form is submitted', async () => {
    await form.fillForm({
      'Network Timeout Before Initiating Failover': 20,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.update', [{
      disabled: false,
      master: true,
      timeout: 20,
    }]);
  });

  it('syncs to peer when Sync To Peer is pressed and confirmed', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync To Peer' }));
    await saveButton.click();

    const rebootCheckbox = await rootLoader.getHarness(MatCheckboxHarness.with({ label: 'Restart standby TrueNAS controller' }));
    await rebootCheckbox.check();
    const confirmCheckbox = await rootLoader.getHarness(MatCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const proceedButton = await rootLoader.getHarness(MatButtonHarness.with({ text: 'Proceed' }));
    await proceedButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.sync_to_peer', [{ reboot: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirm_dialogs.sync_to_message,
    );
  });

  it('syncs from peer when Sync From Peer is pressed and confirmed', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync From Peer' }));
    await saveButton.click();

    const confirmCheckbox = await rootLoader.getHarness(MatCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const proceedButton = await rootLoader.getHarness(MatButtonHarness.with({ text: 'Proceed' }));
    await proceedButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('failover.sync_from_peer');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirm_dialogs.sync_from_message,
    );
  });

  it(`warns when Default TrueNAS controller checkbox is ticked off
    and changes Save button to Save And Failover`, async () => {
    await form.fillForm({
      'Disable Failover': true,
      'Default TrueNAS controller': false,
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: helptextSystemFailover.master_dialog_title,
        message: helptextSystemFailover.master_dialog_warning,
      }),
    );

    const confirmCheckbox = await rootLoader.getHarness(MatCheckboxHarness.with({ label: 'Confirm' }));
    await confirmCheckbox.check();

    const proceedButton = await rootLoader.getHarness(MatButtonHarness.with({ text: 'Continue' }));
    await proceedButton.click();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save And Failover' }));
    expect(saveButton).toExist();
  });
});
