import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject, of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { JobState } from 'app/enums/job-state.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { SystemUpdate } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SaveConfigDialogComponent } from 'app/pages/system/general-settings/save-config-dialog/save-config-dialog.component';
import { UpdateActionsCardComponent } from 'app/pages/system/update/components/update-actions-card/update-actions-card.component';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('UpdateActionsCardComponent', () => {
  let spectator: Spectator<UpdateActionsCardComponent>;
  let loader: HarnessLoader;

  const mockDialogRef = {
    close: jest.fn(),
    afterClosed: () => of(true),
  } as unknown as MatDialogRef<unknown>;

  const createComponent = createComponentFactory({
    component: UpdateActionsCardComponent,
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('core.get_jobs', []),
        mockCall('update.check_available', {
          status: SystemUpdateStatus.Available,
          changes: [],
        } as SystemUpdate),
        mockJob('update.update'),
      ]),
      mockProvider(Router),
      mockProvider(TrainService),
      mockProvider(SnackbarService),
      mockProvider(UpdateService, {
        updatesAvailable$: of(true),
        updateDownloaded$: of(true),
        status$: new BehaviorSubject(undefined),
        error$: new BehaviorSubject(false),
        packages$: new BehaviorSubject([]),
      }),
      mockProvider(SystemGeneralService, {
        updateRunning: of('false'),
        updateRunningNoticeSent: new EventEmitter<string>(),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({
          confirmed: true,
          secondaryCheckbox: true,
        })),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      provideMockStore({
        selectors: [{
          selector: selectIsHaLicensed,
          value: false,
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows save configuration dialog and runs update when Apply Pending Update button is pressed', async () => {
    const applyPendingButton = await loader.getHarness(MatButtonHarness.with({ text: 'Apply Pending update' }));
    await applyPendingButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialogComponent, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'The system will restart and be briefly unavailable while applying updates. Apply updates and restart?',
      title: 'Apply Pending Updates',
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('update.update', [{ reboot: true, resume: false }]);
  });

  it('shows save configuration dialog and runs update when Download Updates button is pressed', async () => {
    const downloadUpdatesButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Updates' }));
    await downloadUpdatesButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('core.get_jobs', [
      [['method', '=', 'update.update'], ['state', '=', JobState.Running]],
    ]);

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('update.check_available');

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialogComponent, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Download',
      hideCheckbox: true,
      message: 'Continue with download?',
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Apply updates and restart system after downloading.',
      title: 'Download Update',
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('update.update', [{ reboot: true, resume: false }]);
  });

  it('shows save configuration dialog and redirects to the manual update page when Install Manual Update File button is pressed', async () => {
    const installManualButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Manual Update File' }));
    await installManualButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialogComponent, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/update/manualupdate']);
  });
});
