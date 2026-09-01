import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxGroupHarness, TnCheckboxHarness, TnFormListHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { CatalogConfig } from 'app/interfaces/catalog.interface';
import { DockerConfig } from 'app/interfaces/docker-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppsSettingsComponent } from 'app/pages/apps/components/catalog-settings/apps-settings.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

function getNvidiaProviders(
  advancedConfig: Partial<AdvancedConfig>,
  nvidiaPresent: boolean,
): unknown[] {
  return [
    mockApi([
      mockCall('catalog.update'),
      mockCall('catalog.trains', ['stable', 'community', 'test']),
      mockCall('catalog.config', { preferred_trains: ['test'] } as CatalogConfig),
      mockCall('docker.status'),
      mockCall('docker.config', {
        enable_image_updates: false,
        address_pools: [],
        pool: 'test-pool',
      } as DockerConfig),
      mockCall('system.advanced.nvidia_present', nvidiaPresent),
      mockCall('system.advanced.config', { nvidia: false, ...advancedConfig } as AdvancedConfig),
      mockCall('system.advanced.update'),
      mockJob('docker.update', fakeSuccessfulJob()),
    ]),
    mockProvider(DialogService),
    mockProvider(FormErrorHandlerService),
    mockAuth(),
    mockProvider(DockerStore, { initialize: jest.fn() }),
  ];
}

describe('AppsSettingsComponent', () => {
  let spectator: Spectator<AppsSettingsComponent>;
  let loader: HarnessLoader;

  const dockerConfig = {
    address_pools: [
      { base: '172.17.0.0/12', size: 12 },
    ],
    enable_image_updates: false,
    registry_mirrors: [
      { url: 'https://registry1.example.com', insecure: false },
      { url: 'https://registry2.example.com', insecure: false },
      { url: 'http://insecure.example.com', insecure: true },
    ],
    pool: 'test-pool',
    dataset: 'test-dataset',
  } as DockerConfig;

  const createComponent = createComponentFactory({
    component: AppsSettingsComponent,
    imports: [
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
    ],
    providers: [
      mockApi([
        mockCall('catalog.update'),
        mockCall('catalog.trains', ['stable', 'community', 'test']),
        mockCall('catalog.config', {
          label: 'TrueNAS',
          preferred_trains: ['test'],
        } as CatalogConfig),
        mockCall('docker.status'),
        mockCall('docker.config', dockerConfig),
        mockCall('system.advanced.nvidia_present', true),
        mockCall('system.advanced.config', { nvidia: false } as AdvancedConfig),
        mockCall('system.advanced.update'),
        mockJob('docker.update', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
      mockProvider(DockerStore, {
        initialize: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    // Mock scrollIntoView since it's not available in test environment
    Element.prototype.scrollIntoView = jest.fn();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads list of available trains and shows them', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('catalog.trains');

    const trains = await loader.getHarness(TnCheckboxGroupHarness);
    expect(await trains.getOptionLabels()).toEqual(['stable', 'community', 'test']);
  });

  it('shows preferred trains when catalog is open for editing', async () => {
    // `IxFormHarness` indexes ix-* controls only, so the migrated tn-checkbox-group is read
    // through the tn-form-field adapter instead.
    const trains = await loader.getHarness(TnFormControlHarness.with({ label: 'Preferred Trains' }));
    expect(await trains.getValue()).toEqual(['test']);
  });

  it('saves catalog updates and reloads catalog apps when form is saved', async () => {
    const trains = await loader.getHarness(TnFormControlHarness.with({ label: 'Preferred Trains' }));
    await trains.setValue(['stable', 'community']);

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('catalog.update', [
      { preferred_trains: ['stable', 'community'] },
    ]);
  });

  // The list entries repeat their labels, so each control is addressed by DOM position within
  // its kind rather than through a by-label index that would collapse the three mirrors into one.
  it('shows current docker settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    expect(await form.getValues()).toMatchObject({ Base: '172.17.0.0/12' });

    const sizes = await loader.getAllHarnesses(TnFormControlHarness.with({ label: 'Size' }));
    expect(await sizes[0].getValue()).toBe('12');

    const imageUpdatesCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Check for docker image updates' }),
    );
    expect(await imageUpdatesCheckbox.isChecked()).toBe(false);

    const mirrorList = await loader.getHarness(TnFormListHarness.with({ label: 'Registry Mirrors' }));
    expect(await mirrorList.getItemCount()).toBe(3);

    const mirrorUrls = await loader.getAllHarnesses(TnFormControlHarness.with({ label: 'Mirror URL' }));
    const insecure = await loader.getAllHarnesses(TnCheckboxHarness.with({ label: 'Insecure' }));

    expect(await mirrorUrls[0].getValue()).toBe('https://registry1.example.com');
    expect(await insecure[0].isChecked()).toBe(false);

    expect(await mirrorUrls[1].getValue()).toBe('https://registry2.example.com');
    expect(await insecure[1].isChecked()).toBe(false);

    expect(await mirrorUrls[2].getValue()).toBe('http://insecure.example.com');
    expect(await insecure[2].isChecked()).toBe(true);
  });

  it('shows nvidia checkbox when nvidia GPU is present', async () => {
    const nvidiaCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Enable NVIDIA GPU Support' }));
    expect(nvidiaCheckbox).toBeTruthy();
  });

  it('updates docker settings when form is edited', async () => {
    const imageUpdatesCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Check for docker image updates' }),
    );
    await imageUpdatesCheckbox.check();

    const addressPoolList = await loader.getHarness(TnFormListHarness.with({ label: 'Address Pools' }));
    await addressPoolList.add();

    const bases = await loader.getAllHarnesses(IxIpInputWithNetmaskHarness);
    const sizes = await loader.getAllHarnesses(TnFormControlHarness.with({ label: 'Size' }));
    await bases[bases.length - 1].setValue('173.17.0.0/12');
    await sizes[sizes.length - 1].setValue(12);

    const mirrorUrls = await loader.getAllHarnesses(TnFormControlHarness.with({ label: 'Mirror URL' }));
    const insecure = await loader.getAllHarnesses(TnCheckboxHarness.with({ label: 'Insecure' }));

    await mirrorUrls[0].setValue('https://new-secure.example.com');
    await insecure[0].uncheck();

    await mirrorUrls[1].setValue('http://new-insecure.example.com');
    await insecure[1].check();

    spectator.component.submit();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('docker.update', [{
      enable_image_updates: true,
      address_pools: [
        { base: '172.17.0.0/12', size: 12 },
        { base: '173.17.0.0/12', size: 12 },
      ],
      registry_mirrors: [
        { url: 'https://new-secure.example.com', insecure: false },
        { url: 'http://new-insecure.example.com', insecure: true },
        { url: 'http://insecure.example.com', insecure: true },
      ],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.update', [{ nvidia: false }]);
  });

  it('submits nvidia as true when user enables the nvidia checkbox', async () => {
    const nvidiaCheckbox = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable NVIDIA GPU Support' }),
    );
    await nvidiaCheckbox.check();

    spectator.component.submit();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.advanced.update', [{ nvidia: true }]);
  });
});

describe('AppsSettingsComponent - nvidia drivers installed without GPU', () => {
  let spectator: Spectator<AppsSettingsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppsSettingsComponent,
    imports: [ReactiveFormsModule, IxIpInputWithNetmaskComponent],
    providers: [
      ...getNvidiaProviders({ nvidia: true }, false),
    ],
  });

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows nvidia checkbox when nvidia drivers are installed even if GPU is absent', async () => {
    const nvidiaCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Enable NVIDIA GPU Support' }));
    expect(nvidiaCheckbox).toBeTruthy();
  });
});

describe('AppsSettingsComponent - no nvidia GPU and no drivers', () => {
  let spectator: Spectator<AppsSettingsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AppsSettingsComponent,
    imports: [ReactiveFormsModule, IxIpInputWithNetmaskComponent],
    providers: [
      ...getNvidiaProviders({ nvidia: false }, false),
    ],
  });

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('hides nvidia checkbox when no GPU is present and no drivers are installed', async () => {
    const nvidiaCheckbox = await loader.getHarnessOrNull(TnCheckboxHarness.with({ label: 'Enable NVIDIA GPU Support' }));
    expect(nvidiaCheckbox).toBeNull();
  });
});
