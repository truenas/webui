import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockCall, mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CatalogConfig } from 'app/interfaces/catalog.interface';
import { DockerConfig } from 'app/interfaces/docker-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxListHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox-list/ix-checkbox-list.harness';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppsSettingsComponent } from 'app/pages/apps/components/catalog-settings/apps-settings.component';
import { DockerStore } from 'app/pages/apps/store/docker.store';

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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

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
        mockJob('docker.update', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(SlideInRef, slideInRef),
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

    const checkboxList = await loader.getHarness(IxCheckboxListHarness);
    const checkboxes = await checkboxList.getCheckboxes();
    expect(checkboxes).toHaveLength(3);
    expect(await checkboxes[0].getLabelText()).toBe('stable');
    expect(await checkboxes[1].getLabelText()).toBe('community');
    expect(await checkboxes[2].getLabelText()).toBe('test');
  });

  it('shows preferred trains when catalog is open for editing', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toMatchObject({
      'Preferred Trains': ['test'],
    });
  });

  it('saves catalog updates and reloads catalog apps when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Preferred Trains': ['stable', 'community'],
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('catalog.update', [
      { preferred_trains: ['stable', 'community'] },
    ]);
  });

  it('shows current docker settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(values).toMatchObject({
      'Check for docker image updates': false,
      Base: '172.17.0.0/12',
      Size: '12',
    });

    const mirrorList = await loader.getHarness(IxListHarness.with({ label: 'Registry Mirrors' }));
    const mirrorItems = await mirrorList.getListItems();

    expect(mirrorItems).toHaveLength(3);

    const firstMirrorValues = await mirrorItems[0].getFormValues();
    expect(firstMirrorValues).toMatchObject({
      'Mirror URL': 'https://registry1.example.com',
      Insecure: false,
    });

    const secondMirrorValues = await mirrorItems[1].getFormValues();
    expect(secondMirrorValues).toMatchObject({
      'Mirror URL': 'https://registry2.example.com',
      Insecure: false,
    });

    const thirdMirrorValues = await mirrorItems[2].getFormValues();
    expect(thirdMirrorValues).toMatchObject({
      'Mirror URL': 'http://insecure.example.com',
      Insecure: true,
    });
  });

  it('updates docker settings when form is edited', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Check for docker image updates': true,
    });

    const addressPoolList = await loader.getHarness(IxListHarness.with({ label: 'Address Pools' }));

    await addressPoolList.pressAddButton();

    const newAddressPool = await addressPoolList.getLastListItem();
    await newAddressPool.fillForm({
      Base: '173.17.0.0/12',
      Size: 12,
    });

    const mirrorList = await loader.getHarness(IxListHarness.with({ label: 'Registry Mirrors' }));

    const existingMirrors = await mirrorList.getListItems();
    await existingMirrors[0].fillForm({
      'Mirror URL': 'https://new-secure.example.com',
      Insecure: false,
    });

    await existingMirrors[1].fillForm({
      'Mirror URL': 'http://new-insecure.example.com',
      Insecure: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

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
  });
});
