import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { ReplicationFormComponent } from 'app/pages/system/advanced/replication-form/replication-form.component';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ReplicationFormComponent', () => {
  let spectator: Spectator<ReplicationFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: ReplicationFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('replication.config.config', {
          max_parallel_replication_tasks: 1,
        }),
        mockCall('replication.config.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(SystemGeneralService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('shows current system advanced replication values when form is being edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toEqual({
      'Replication Tasks Limit': '1',
    });
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Replication Tasks Limit': '',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('replication.config.update', [
      {
        max_parallel_replication_tasks: null,
      },
    ]);
  });
});
