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
          '[AUTO]': 'Automatic',
          bridge1: 'bridge1',
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

    // Save button should be enabled when bridge is not automatic
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);
  });

  it('updates global settings and shows network fields when bridge is [AUTO] and closes slide-in', async () => {
    await spectator.fixture.whenStable();

    await form.fillForm({
      Bridge: 'Automatic',
    });

    // Network fields should now be visible
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeTruthy();

    // Save button should be enabled because v4_network already has a value from initial config
    let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);

    saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
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

  it('validates at least one network is required when bridge is automatic', async () => {
    await spectator.fixture.whenStable();

    // Switch to automatic bridge
    await form.fillForm({
      Bridge: 'Automatic',
    });

    // Clear both v4 and v6 network values
    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': '',
    });

    // Save button should be disabled because at least one network is required
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('allows submitting with only IPv6 network when bridge is automatic', async () => {
    await spectator.fixture.whenStable();

    // Switch to automatic bridge
    await form.fillForm({
      Bridge: 'Automatic',
    });

    // Clear v4, set v6
    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': 'fd00::/64',
    });

    // Save button should be enabled because v6 is provided
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);

    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.update', [{
      bridge: '',
      v4_network: null,
      v6_network: 'fd00::/64',
      preferred_pool: 'tank',
    }]);
  });

  it('allows resetting bridge selection and clears network validators', async () => {
    await spectator.fixture.whenStable();

    // Save button should be enabled initially
    let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);

    // Switch to automatic
    await form.fillForm({
      Bridge: 'Automatic',
    });

    // Clear both network fields - save button should be disabled
    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': '',
    });
    saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(true);

    // Switch back to a specific bridge
    await form.fillForm({
      Bridge: 'bridge1',
    });

    // Save button should be enabled again as network fields are no longer required
    saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    expect(await saveButton.isDisabled()).toBe(false);
  });
});

describe('GlobalConfigFormComponent - automatic bridge', () => {
  let spectator: Spectator<GlobalConfigFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: GlobalConfigFormComponent,
    providers: [
      mockApi([
        mockCall('lxc.config', {
          bridge: '', // API returns empty string for automatic
          v4_network: '10.0.0.0/24',
          v6_network: 'fd00::/64',
          preferred_pool: 'tank',
        }),
        mockCall('lxc.bridge_choices', {
          '[AUTO]': 'Automatic',
          bridge1: 'bridge1',
        }),
        mockCall('container.pool_choices', {
          tank: 'tank',
        }),
        mockCall('lxc.update'),
      ]),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => ({
          bridge: '',
          v4_network: '10.0.0.0/24',
          v6_network: 'fd00::/64',
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

  it('loads automatic bridge configuration from API correctly', async () => {
    await spectator.fixture.whenStable();

    // Form should show Automatic as selected
    expect(await form.getValues()).toEqual({
      'Preferred Pool': 'tank',
      Bridge: 'Automatic',
      'IPv4 Network': '10.0.0.0/24',
      'IPv6 Network': 'fd00::/64',
    });

    // Network fields should be visible
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeTruthy();
  });
});
