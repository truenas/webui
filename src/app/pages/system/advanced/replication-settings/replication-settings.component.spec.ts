import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ReplicationSettingsComponent } from 'app/pages/system/advanced/replication-settings/replication-settings.component';
import { DialogService, SystemGeneralService, WebSocketService2 } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ReplicationSettingsFormComponent', () => {
  let spectator: Spectator<ReplicationSettingsComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService2;
  const createComponent = createComponentFactory({
    component: ReplicationSettingsComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket2([
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
    ws = spectator.inject(WebSocketService2);
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
