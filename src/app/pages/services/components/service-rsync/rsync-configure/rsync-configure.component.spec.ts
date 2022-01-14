import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { RsyncConfig } from 'app/interfaces/rsync-config.interface';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { RsyncConfigureComponent } from './rsync-configure.component';

describe('ConfigureRsyncComponent', () => {
  let spectator: Spectator<RsyncConfigureComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: RsyncConfigureComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('rsyncd.config', {
          port: 873,
          auxiliary: '',
        } as RsyncConfig),
        mockCall('rsyncd.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(AppLoaderService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current rsync config and show them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('rsyncd.config');
    expect(values).toEqual({
      'TCP Port': '873',
      'Auxiliary Parameters': '',
    });
  });

  it('sends an update payload to websocket when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'TCP Port': '873',
      'Auxiliary Parameters': 'test',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('rsyncd.update', [{
      port: '873',
      auxiliary: 'test',
    }]);
  });
});
