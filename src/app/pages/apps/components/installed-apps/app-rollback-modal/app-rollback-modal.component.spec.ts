import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { App } from 'app/interfaces/app.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { WebSocketService } from 'app/services/ws.service';

describe('AppRollbackModalComponent', () => {
  let spectator: Spectator<AppRollbackModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AppRollbackModalComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'my-app',
        } as App,
      },
      mockAuth(),
      mockWebSocket([
        mockJob('app.rollback'),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  // TODO
  it.skip('shows a list of previous versions for an installed app to roll back to', async () => {
    const versionSelect = await loader.getHarness(IxSelectHarness);
    const options = await versionSelect.getOptionLabels();

    expect(options).toEqual(['0.9.9', '0.9.8']);
  });

  // TODO
  it.skip('rolls back app when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Version: '0.9.8',
      'Roll back snapshots': true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await rollbackButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'app.rollback',
      ['my-app', { app_version: '0.9.8', rollback_snapshot: true }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
