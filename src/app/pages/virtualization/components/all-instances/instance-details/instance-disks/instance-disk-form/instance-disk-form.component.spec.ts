import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import {
  InstanceDiskFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { ApiService } from 'app/services/websocket/api.service';

describe('InstanceDiskFormComponent', () => {
  let spectator: Spectator<InstanceDiskFormComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: InstanceDiskFormComponent,
    providers: [
      mockApi([
        mockCall('virt.instance.device_add'),
      ]),
      mockProvider(ChainedRef, {
        getData: () => 'my-instance',
        close: jest.fn(),
      }),
      mockProvider(SnackbarService),
      mockProvider(FilesystemService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('creates a new disk for the instance provided when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);

    await form.fillForm({
      Source: '/mnt/path',
      Destination: 'destination',
    });

    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
      response: true,
      error: false,
    });
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('virt.instance.device_add', ['my-instance', {
      source: '/mnt/path',
      destination: 'destination',
      dev_type: VirtualizationDeviceType.Disk,
    }]);
  });
});
