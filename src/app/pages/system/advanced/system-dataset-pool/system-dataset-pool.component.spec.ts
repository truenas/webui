import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { DialogService, SystemGeneralService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';
import { MockWebsocketService } from '../../../../core/testing/classes/mock-websocket.service';
import { ServiceName } from '../../../../enums/service-name.enum';
import { ServiceStatus } from '../../../../enums/service-status.enum';
import { Service } from '../../../../interfaces/service.interface';
import { SystemDatasetConfig } from '../../../../interfaces/system-dataset-config.interface';
import { SystemDatasetPoolComponent } from './system-dataset-pool.component';

describe('SystemDatasetPoolComponent', () => {
  let spectator: Spectator<SystemDatasetPoolComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;
  const createComponent = createComponentFactory({
    component: SystemDatasetPoolComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('systemdataset.config', { pool: 'current-pool' } as SystemDatasetConfig),
        mockCall('service.query', [
          {
            service: ServiceName.Cifs,
            state: ServiceStatus.Stopped,
          },
        ] as Service[]),
        mockCall('systemdataset.pool_choices', {
          'current-pool': 'current-pool',
          'new-pool': 'new-pool',
        }),
        mockJob('systemdataset.update'),
      ]),
      mockProvider(IxModalService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SystemGeneralService),
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

    expect(ws.call).toHaveBeenCalledWith('systemdataset.config');
    expect(values).toEqual({
      'Select Pool': 'current-pool',
    });
  });

  it('updates system dataset and refreshes settings when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Select Pool': 'new-pool',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.job).toHaveBeenCalledWith('systemdataset.update', [{
      pool: 'new-pool',
    }]);
    expect(spectator.inject(SystemGeneralService).refreshSysGeneral).toHaveBeenCalled();
  });

  it('should warns user about restarting an SMB service when it is running and form is saved', async () => {
    ws.mockCall('service.query', [
      {
        service: ServiceName.Cifs,
        state: ServiceStatus.Running,
      },
    ] as Service[]);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Restart SMB Service',
      }),
    );
  });
});
