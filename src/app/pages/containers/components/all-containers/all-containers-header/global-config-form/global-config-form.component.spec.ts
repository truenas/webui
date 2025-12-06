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
} from 'app/pages/containers/components/all-containers/all-containers-header/global-config-form/global-config-form.component';

describe('GlobalConfigFormComponent', () => {
  let spectator: Spectator<GlobalConfigFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: GlobalConfigFormComponent,
    providers: [
      mockApi([
        mockCall('lxc.config', {
          bridge: 'bridge1',
          v4_network: '1.2.3.4/24',
          v6_network: null,
          preferred_pool: 'tank',
        }),
        mockCall('lxc.bridge_choices', {
          bridge1: 'bridge1',
          '': 'Automatic',
        }),
        mockCall('container.pool_choices', {
          tank: 'tank',
          pool2: 'pool2',
        }),
        mockCall('lxc.update'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => ({
          bridge: 'bridge1',
          v4_network: '1.2.3.4/24',
          v6_network: null as string | null,
          preferred_pool: 'tank',
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

  it('shows current global settings from the API', async () => {
    await spectator.fixture.whenStable();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.config');

    expect(await form.getValues()).toEqual({
      'Preferred Pool': 'tank',
      Bridge: 'bridge1',
    });

    // Network fields should not be visible when bridge is not auto
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeFalsy();
    const v6NetworkInput = await form.getControl('IPv6 Network');
    expect(v6NetworkInput).toBeFalsy();
  });

  it('updates global settings and shows network fields when bridge is [AUTO] and closes slide-in', async () => {
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
      preferred_pool: 'tank',
    }]);
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
      response: true,
    });
  });

  it('allows updating preferred pool', async () => {
    await spectator.fixture.whenStable();

    await form.fillForm({
      'Preferred Pool': 'pool2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.update', [{
      bridge: 'bridge1',
      v4_network: '1.2.3.4/24',
      v6_network: null,
      preferred_pool: 'pool2',
    }]);
  });
});
