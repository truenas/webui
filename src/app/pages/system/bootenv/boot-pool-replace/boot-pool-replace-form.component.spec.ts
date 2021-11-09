import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services';
import { BootPoolReplaceFormComponent } from './boot-pool-replace-form.component';

describe('BootPoolReplaceFormComponent', () => {
  let spectator: Spectator<BootPoolReplaceFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createRoutingFactory({
    component: BootPoolReplaceFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('disk.get_unused', [
          {
            name: 'sdb',
          },
        ] as UnusedDisk[]),
        mockCall('boot.replace'),
      ]),
      mockProvider(FormErrorHandlerService),
    ],
    params: {
      pk: '/dev/sda3',
    },
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Member Disk': 'sdb',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('boot.replace', ['sda3', 'sdb']);
  });
});
