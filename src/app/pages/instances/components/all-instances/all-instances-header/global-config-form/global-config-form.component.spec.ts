import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  GlobalConfigFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';

describe('GlobalConfigFormComponent', () => {
  let spectator: Spectator<GlobalConfigFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: GlobalConfigFormComponent,
    providers: [
      mockApi([
        mockCall('virt.global.pool_choices', {
          '[Disabled]': '[Disabled]',
          poolio: 'poolio',
        }),
        mockCall('lxc.bridge_choices', {
          bridge1: 'bridge1',
          '': 'Automatic',
        }),
        mockCall('lxc.update'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => ({
          storage_pools: ['poolio'],
          bridge: 'bridge1',
          v4_network: '1.2.3.4/24',
          v6_network: null as string | null,
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
    // Wait for the bridge options to load and set the bridge value
    await spectator.fixture.whenStable();

    expect(await form.getValues()).toEqual({
      Bridge: 'bridge1',
    });

    const v4NetworkInput = await form.getControl('v4_network');
    expect(v4NetworkInput).toBeFalsy();
    const v6NetworkInput = await form.getControl('v6_network');
    expect(v6NetworkInput).toBeFalsy();
  });

  it('updates global settings and shows network fields when bridge is [AUTO] and closes slide-in', async () => {
    // Wait for the bridge options to load and set the bridge value
    await spectator.fixture.whenStable();

    await form.fillForm({
      Bridge: 'Automatic',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.update', [{
      bridge: '',
      v4_network: '1.2.3.4/24',
      v6_network: null,
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: true,
    });
  });
});
