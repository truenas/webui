import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogWithSecondaryCheckboxResult } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

describe('FailoverFormComponent', () => {
  let spectator: Spectator<FailoverFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: FailoverFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('failover.update'),
        mockCall('failover.sync_to_peer'),
        mockCall('failover.sync_from_peer'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({
          id: 3,
          master: true,
          disabled: false,
          timeout: 0,
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(WebSocketStatusService, {
        isConnected$: of(true),
      }),
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows current failover settings', async () => {
    expect(await form.getValues()).toEqual({
      'Enable Automatic Failover': true,
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync To Peer' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.sync_to_peer', [{ reboot: true }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirm_dialogs.sync_to_message,
    );
  });

  it('syncs from peer when Sync From Peer is pressed and confirmed', async () => {
    jest.spyOn(spectator.inject(DialogService), 'confirm').mockReturnValue(of({
      confirmed: true,
      secondaryCheckbox: true,
    } as DialogWithSecondaryCheckboxResult));

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync From Peer' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('failover.sync_from_peer');
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextSystemFailover.confirm_dialogs.sync_from_message,
    );
  });

  it('warns when Default TrueNAS controller checkbox is ticked off and changes Save button to Save And Failover', async () => {
    await form.fillForm({
      'Enable Automatic Failover': false,
      'Default TrueNAS controller': false,
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: helptextSystemFailover.master_dialog_title,
        message: helptextSystemFailover.master_dialog_warning,
      }),
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save And Failover' }));
    expect(saveButton).toExist();
  });
});
