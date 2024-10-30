import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { StorageSettingsFormComponent } from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { selectServices } from 'app/store/services/services.selectors';

describe('StorageSettingsFormComponent', () => {
  let spectator: Spectator<StorageSettingsFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebSocketService;
  const createComponent = createComponentFactory({
    component: StorageSettingsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('systemdataset.pool_choices', {
          'current-pool': 'current-pool',
          'new-pool': 'new-pool',
        }),
        mockJob('systemdataset.update', fakeSuccessfulJob()),
        mockCall('systemdataset.config', {
          pool: 'current-pool',
        } as SystemDatasetConfig),
        mockCall('system.advanced.update'),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              service: ServiceName.Cifs,
              state: ServiceStatus.Running,
            } as Service],
          },
        ],
      }),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({ swapSize: 5, systemDsPool: 'current-pool' })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebSocketService);
  });

  it('loads and shows current system dataset pool', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Select Pool': 'current-pool',
    });
  });

  it('updates system dataset and refreshes settings when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Select Pool': 'new-pool',
    });
    spectator.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
  });

  it('should warns user about restarting an SMB service when it is running and form is saved', async () => {
    spectator.detectChanges();
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Restart SMB Service',
      }),
    );
  });
});
