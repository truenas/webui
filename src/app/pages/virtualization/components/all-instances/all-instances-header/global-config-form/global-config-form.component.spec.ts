import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  GlobalConfigFormComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('GlobalConfigFormComponent', () => {
  let spectator: Spectator<GlobalConfigFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: GlobalConfigFormComponent,
    imports: [

    ],
    providers: [
      mockWebSocket([
        mockCall('virt.global.pool_choices', {
          '[Disabled]': 'Disabled',
          poolio: 'poolio',
        }),
        mockJob('virt.global.update', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => ({
          pool: 'poolio',
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows current global settings from the slide-in data', async () => {
    expect(await form.getValues()).toEqual({
      Pool: 'poolio',
    });
  });

  it('updates global settings and closes slide-in', async () => {
    await form.fillForm({
      Pool: 'Disabled',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.global.update', [{
      pool: '[Disabled]',
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
      response: undefined,
      error: false,
    });
  });
});
