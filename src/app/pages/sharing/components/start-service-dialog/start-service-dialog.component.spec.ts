import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { IxSlideToggleHarness } from 'app/modules/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { StartServiceDialogComponent, StartServiceDialogResult } from 'app/pages/sharing/components/start-service-dialog/start-service-dialog.component';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectServices } from 'app/store/services/services.selectors';

const cifsService = {
  id: 4,
  service: ServiceName.Cifs,
  state: ServiceStatus.Stopped,
  enable: false,
};

describe('StartServiceDialogComponent', () => {
  let spectator: Spectator<StartServiceDialogComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<ServicesState>;
  const afterClosed$ = new Subject<StartServiceDialogResult>();

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
      mockProvider(MatDialogRef, {
        afterClosed: () => afterClosed$,
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => afterClosed$,
        })),
      }),
      provideMockStore({
        selectors: [{
          selector: selectServices,
          value: [cifsService],
        }],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    store$ = spectator.inject(MockStore);
  });

  it('cifs: shows a dialog with Enable automatically toggle.', async () => {
    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxSlideToggleHarness.with({ label: 'Enable this service to start automatically.' }),
    );

    expect(await enableAutomaticallyCheckbox.getValue()).toBe(false);

    await enableAutomaticallyCheckbox.setValue(true);

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await startButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('service.update', [4, { enable: true }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('service.start', ['cifs', { silent: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: true,
      startAutomatically: true,
    });
  });

  it('ensures initial state for slide toggle matches current service value', async () => {
    store$.overrideSelector(selectServices, [{ ...cifsService, enable: true } as Service]);
    store$.refreshState();

    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxSlideToggleHarness.with({ label: 'Enable this service to start automatically.' }),
    );
    expect(await enableAutomaticallyCheckbox.getValue()).toBe(true);

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await startButton.click();

    expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalledWith('service.update', [4, { enable: true }]);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('service.start', ['cifs', { silent: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: true,
      startAutomatically: true,
    });
  });

  it('returns false result when No is pressed', async () => {
    const noButton = await loader.getHarness(MatButtonHarness.with({ text: 'No' }));
    await noButton.click();

    expect(spectator.inject(WebSocketService).call).not.toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: false,
      startAutomatically: false,
    });
  });
});
