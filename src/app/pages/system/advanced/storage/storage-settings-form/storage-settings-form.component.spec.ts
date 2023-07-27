import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { StorageSettingsFormComponent } from 'app/pages/system/advanced/storage/storage-settings-form/storage-settings-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

describe('SystemDatasetPoolComponent', () => {
  let spectator: Spectator<StorageSettingsFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;
  const createComponent = createComponentFactory({
    component: StorageSettingsFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('service.query', [
          {
            service: ServiceName.Cifs,
            state: ServiceStatus.Running,
          },
        ] as Service[]),
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
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {
              swapondrive: 5,
            },
          },
        ],
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebsocketService);
  });

  it('loads and shows current system dataset pool', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Select Pool': 'current-pool',
      'Swap Size': '5',
    });
  });

  it('updates system dataset and refreshes settings when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Select Pool': 'new-pool',
      'Swap Size': '4',
    });
    spectator.detectChanges();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(ws.call).toHaveBeenCalledWith('system.advanced.update', [{ swapondrive: 4 }]);
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
