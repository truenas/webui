import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnSelectHarness } from '@truenas/ui-components';
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

  /** Selects an option in one of the two tn-select controls (Bridge / Preferred Pool). */
  async function selectOption(displayText: string | RegExp, option: string): Promise<void> {
    const select = await loader.getHarness(TnSelectHarness.with({ displayText }));
    await select.selectOption(option);
    spectator.detectChanges();
    await spectator.fixture.whenStable();
  }

  async function getSaveButton(): Promise<TnButtonHarness> {
    return loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
  }

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
    await spectator.fixture.whenStable();
  });

  it('shows current global settings from the API', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.config');

    const bridgeSelect = await loader.getHarness(TnSelectHarness.with({ displayText: 'bridge1' }));
    expect(await bridgeSelect.getDisplayText()).toBe('bridge1');

    const poolSelect = await loader.getHarness(TnSelectHarness.with({ displayText: 'tank' }));
    expect(await poolSelect.getDisplayText()).toBe('tank');

    // Network fields should not be visible when bridge is not auto
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeFalsy();

    // Save button should be enabled when bridge is not automatic
    const saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(false);
  });

  it('updates global settings and shows network fields when bridge is [AUTO] and closes slide-in', async () => {
    await selectOption('bridge1', 'Automatic');

    // Network fields should now be visible
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeTruthy();

    // Save button should be enabled because v4_network already has a value from initial config
    const saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(false);

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
    await selectOption('tank', 'pool2');

    const saveButton = await getSaveButton();
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.update', [{
      bridge: 'bridge1',
      v4_network: '1.2.3.4/24',
      v6_network: null,
      preferred_pool: 'pool2',
    }]);
  });

  it('validates at least one network is required when bridge is automatic', async () => {
    await selectOption('bridge1', 'Automatic');

    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': '',
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(true);
  });

  it('allows submitting with only IPv6 network when bridge is automatic', async () => {
    await selectOption('bridge1', 'Automatic');

    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': 'fd00::/64',
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const saveButton = await getSaveButton();
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
    let saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(false);

    await selectOption('bridge1', 'Automatic');

    await form.fillForm({
      'IPv4 Network': '',
      'IPv6 Network': '',
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(true);

    await selectOption('Automatic', 'bridge1');

    saveButton = await getSaveButton();
    expect(await saveButton.isDisabled()).toBe(false);
  });

  it('shows hint text when automatic bridge is selected', async () => {
    await selectOption('bridge1', 'Automatic');

    const hintText = spectator.query('.hint');
    expect(hintText).toBeTruthy();
    expect(hintText?.textContent).toContain('At least one network (IPv4 or IPv6) must be specified');
  });

  it('hides hint text when switching away from automatic bridge', async () => {
    await selectOption('bridge1', 'Automatic');

    let hintText = spectator.query('.hint');
    expect(hintText).toBeTruthy();

    await selectOption('Automatic', 'bridge1');

    hintText = spectator.query('.hint');
    expect(hintText).toBeFalsy();
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
    await spectator.fixture.whenStable();
  });

  it('loads automatic bridge configuration from API correctly', async () => {
    const bridgeSelect = await loader.getHarness(TnSelectHarness.with({ displayText: 'Automatic' }));
    expect(await bridgeSelect.getDisplayText()).toBe('Automatic');

    expect(await form.getValues()).toEqual({
      'IPv4 Network': '10.0.0.0/24',
      'IPv6 Network': 'fd00::/64',
    });

    // Network fields should be visible
    const v4NetworkInput = await form.getControl('IPv4 Network');
    expect(v4NetworkInput).toBeTruthy();
  });
});

describe('GlobalConfigFormComponent - side panel host (no SlideInRef)', () => {
  let spectator: Spectator<GlobalConfigFormComponent>;
  let loader: HarnessLoader;

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
        mockCall('lxc.bridge_choices', { '[AUTO]': 'Automatic', bridge1: 'bridge1' }),
        mockCall('container.pool_choices', { tank: 'tank' }),
        mockCall('lxc.update'),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await spectator.fixture.whenStable();
  });

  it('self-loads config without a SlideInRef', () => {
    expect(spectator.component.slideInRef).toBeNull();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.config');
  });

  it('does not render the in-form Save button in side-panel mode', async () => {
    const saveButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Save' }));
    expect(saveButtons).toHaveLength(0);
  });

  it('exposes canSubmit and emits closed on submit', async () => {
    expect(spectator.component.canSubmit()).toBe(true);

    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('lxc.update', [{
      bridge: 'bridge1',
      v4_network: '1.2.3.4/24',
      v6_network: null,
      preferred_pool: 'tank',
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
  });
});
