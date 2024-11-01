import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
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
    providers: [
      mockWebSocket([
        mockCall('virt.global.pool_choices', {
          '[Disabled]': '[Disabled]',
          poolio: 'poolio',
        }),
        mockCall('virt.global.bridge_choices', {
          bridge1: 'bridge1',
          '[AUTO]': '[AUTO]',
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
          bridge: 'bridge1',
          v4_network: '1.2.3.4/24',
          v6_network: null,
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
      Bridge: 'bridge1',
      Pool: 'poolio',
    });

    const v4NetworkInput = await form.getControl('v4_network');
    expect(v4NetworkInput).toBeFalsy();
    const v6NetworkInput = await form.getControl('v6_network');
    expect(v6NetworkInput).toBeFalsy();
  });

  it('updates global settings and shows network fields when bridge is [AUTO] and closes slide-in', async () => {
    await form.fillForm({
      Pool: '[Disabled]',
      Bridge: '[AUTO]',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.global.update', [{
      pool: '[Disabled]',
      bridge: '[AUTO]',
      v4_network: '1.2.3.4/24',
      v6_network: null,
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
      response: undefined,
      error: false,
    });
  });
});
