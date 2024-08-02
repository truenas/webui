import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { App, ChartReleaseVersion } from 'app/interfaces/chart-release.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/forms/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { WebSocketService } from 'app/services/ws.service';

describe('AppRollbackModalComponent', () => {
  let spectator: Spectator<AppRollbackModalComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: AppRollbackModalComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(MatDialogRef),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          name: 'my-app',
          history: {
            '0.9.9': {} as ChartReleaseVersion,
            '0.9.8': {} as ChartReleaseVersion,
          } as App['history'],
        } as App,
      },
      mockAuth(),
      mockWebSocket([
        mockJob('chart.release.rollback'),
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

  it('shows a list of previous versions from chart release to roll back to', async () => {
    const versionSelect = await loader.getHarness(IxSelectHarness);
    const options = await versionSelect.getOptionLabels();

    expect(options).toEqual(['0.9.9', '0.9.8']);
  });

  it('rolls back chart when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Version: '0.9.8',
      'Roll back snapshots': true,
    });

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await rollbackButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'chart.release.rollback',
      ['my-app', { item_version: '0.9.8', rollback_snapshot: true }],
    );
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });
});
