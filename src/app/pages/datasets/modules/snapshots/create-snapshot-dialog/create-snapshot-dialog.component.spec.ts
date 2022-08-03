import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  CreateSnapshotDialogComponent,
} from 'app/pages/datasets/modules/snapshots/create-snapshot-dialog/create-snapshot-dialog.component';
import { DialogService, WebSocketService } from 'app/services';

describe('CreateSnapshotDialogComponent', () => {
  let spectator: Spectator<CreateSnapshotDialogComponent>;
  let websocket: WebSocketService;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateSnapshotDialogComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
      AppLoaderModule,
    ],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: 'my-dataset' },
      mockProvider(DialogService),
      mockProvider(MatDialogRef),
      mockWebsocket([
        mockCall('zfs.snapshot.create'),
        mockCall('vmware.dataset_has_vms'),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    websocket = spectator.inject(WebSocketService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('presets name with current date and time', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    const defaultName = await nameInput.getValue();

    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');

    expect(defaultName).toBe(`manual-${datetime}`);
  });

  it('creates a snapshot when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Name: 'muh_first_snapshot',
      Recursive: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Snapshot' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.create', [{
      dataset: 'my-dataset',
      name: 'muh_first_snapshot',
      recursive: true,
    }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('checks if there are VMs in a dataset and allows to enable VM sync when they are', async () => {
    const mockWebsocket = spectator.inject(MockWebsocketService);
    mockWebsocket.mockCallOnce('vmware.dataset_has_vms', true);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Name: 'muh_vm_snapshot',
      Recursive: true,
    });
    await form.fillForm({
      'VMWare Sync': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Snapshot' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('zfs.snapshot.create', [{
      dataset: 'my-dataset',
      name: 'muh_vm_snapshot',
      recursive: true,
      vmware_sync: true,
    }]);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('re-checks for VMs in dataset when recursive checkbox is toggled', async () => {
    jest.clearAllMocks();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Recursive: true,
    });

    expect(websocket.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['my-dataset', true]);
  });
});
