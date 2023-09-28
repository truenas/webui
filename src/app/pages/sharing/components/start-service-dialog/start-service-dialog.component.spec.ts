import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { IxCheckboxHarness } from 'app/modules/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { StartServiceDialogComponent } from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';
import { WebSocketService } from 'app/services/ws.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('StartServiceDialogComponent', () => {
  let spectator: Spectator<StartServiceDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: StartServiceDialogComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('service.update'),
        mockCall('service.start'),
      ]),
      {
        provide: MAT_DIALOG_DATA,
        useValue: ServiceName.Cifs,
      },
      mockProvider(MatDialogRef),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              id: 4,
              service: ServiceName.Cifs,
              state: ServiceStatus.Running,
              enabled: false,
            }],
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a dialog with Enable automatically checkbox.', async () => {
    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxCheckboxHarness.with({ label: 'Enable this service to start automatically.' }),
    );
    await enableAutomaticallyCheckbox.setValue(true);

    const enableButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await enableButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('service.update', [4, { enable: true }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('service.start', ['cifs', { silent: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(true);
  });

  it('returns false result when No is pressed', async () => {
    const noButton = await loader.getHarness(MatButtonHarness.with({ text: 'No' }));
    await noButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });
});
