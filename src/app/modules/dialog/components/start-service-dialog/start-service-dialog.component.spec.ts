import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { StartServiceDialogComponent, StartServiceDialogResult } from 'app/modules/dialog/components/start-service-dialog/start-service-dialog.component';
import { IxSlideToggleHarness } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectServices } from 'app/store/services/services.selectors';

const cifsService = {
  id: 4,
  service: ServiceName.Cifs,
  state: ServiceStatus.Stopped,
  enable: false,
} as Service;

describe('StartServiceDialogComponent', () => {
  let spectator: Spectator<StartServiceDialogComponent>;
  let loader: HarnessLoader;
  let store$: MockStore<ServicesState>;
  const afterClosed$ = new Subject<StartServiceDialogResult>();

  const createComponent = createComponentFactory({
    component: StartServiceDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
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

  it('cifs: shows a dialog and submit with Enable automatically checkbox.', async () => {
    store$.overrideSelector(selectServices, [cifsService]);
    store$.refreshState();
    spectator.fixture.detectChanges();

    expect(spectator.query('h1')).toHaveText('Start SMB Service');
    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxSlideToggleHarness.with({ label: 'Enable this service to start automatically.' }),
    );

    expect(await enableAutomaticallyCheckbox.getValue()).toBe(true);

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await startButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('service.update', [4, { enable: true }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('service.start', ['cifs', { silent: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: true,
      startAutomatically: true,
    });
  });

  it('cifs: shows a dialog and submit without Enable automatically checkbox.', async () => {
    store$.overrideSelector(selectServices, [cifsService]);
    store$.refreshState();
    spectator.fixture.detectChanges();

    expect(spectator.query('h1')).toHaveText('Start SMB Service');
    expect(spectator.query('.description')).toHaveText(
      'SMB Service is not currently running. Start the service now?',
    );

    const enableAutomaticallyCheckbox = await loader.getHarness(
      IxSlideToggleHarness.with({ label: 'Enable this service to start automatically.' }),
    );
    await enableAutomaticallyCheckbox.setValue(false);

    const startButton = await loader.getHarness(MatButtonHarness.with({ text: 'Start' }));
    await startButton.click();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('service.update', [4, { enable: true }]);
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('service.start', ['cifs', { silent: false }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: true,
      startAutomatically: false,
    });
  });

  it('returns false result when No is pressed', async () => {
    const noButton = await loader.getHarness(MatButtonHarness.with({ text: 'No' }));
    await noButton.click();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
      start: false,
      startAutomatically: false,
    });
  });
});
