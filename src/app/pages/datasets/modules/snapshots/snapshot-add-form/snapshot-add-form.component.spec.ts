import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns-tz';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SlideInService } from 'app/services/slide-in.service';

const mockDatasets = [
  { name: 'APPS' },
  { name: 'POOL' },
] as Dataset[];

const mockNamingSchema = ['%Y %H %d %M %m'];

describe('SnapshotAddFormComponent', () => {
  let spectator: Spectator<SnapshotAddFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebSocketService;

  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('zfs.snapshot.create'),
        mockCall('pool.dataset.query', mockDatasets),
        mockCall('replication.list_naming_schemas', mockNamingSchema),
        mockCall('pool.dataset.details'),
        mockCall('vmware.dataset_has_vms', true),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebSocketService);
  });

  it('presets name with current date and time', async () => {
    const nameInput = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
    const defaultName = await nameInput.getValue();
    const datetime = format(new Date(), 'yyyy-MM-dd_HH-mm');

    expect(defaultName).toBe(`manual-${datetime}`);
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Dataset: 'APPS',
      Name: 'test-snapshot-name',
    });

    expect(ws.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', false]);

    await form.fillForm({
      'VMWare Sync': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('zfs.snapshot.create', [
      {
        dataset: 'APPS',
        name: 'test-snapshot-name',
        recursive: false,
        vmware_sync: true,
      },
    ]);
  });

  it('checks when form is submitted with naming schema', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Dataset: 'APPS',
      Name: null,
      Recursive: true,
      'Naming Schema': '%Y %H %d %M %m',
    });

    expect(ws.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', true]);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('zfs.snapshot.create', [
      {
        dataset: 'APPS',
        naming_schema: '%Y %H %d %M %m',
        recursive: true,
        vmware_sync: false,
      },
    ]);
  });

  it('should raise error when name and naming schema has values', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Dataset: 'APPS',
      Name: 'snapshot-name',
      'Naming Schema': '%Y %H %d %M %m',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).not.toHaveBeenCalledWith('zfs.snapshot.create');
  });

  it('re-checks for VMs in dataset when recursive checkbox is toggled or dataset changed', async () => {
    jest.clearAllMocks();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Dataset: 'POOL' });
    await form.fillForm({ Recursive: true });
    await form.fillForm({ Dataset: 'APPS' });
    await form.fillForm({ Recursive: false });

    expect(ws.call).toHaveBeenNthCalledWith(1, 'vmware.dataset_has_vms', ['POOL', false]);
    expect(ws.call).toHaveBeenNthCalledWith(2, 'vmware.dataset_has_vms', ['POOL', true]);
    expect(ws.call).toHaveBeenNthCalledWith(3, 'vmware.dataset_has_vms', ['APPS', true]);
    expect(ws.call).toHaveBeenNthCalledWith(4, 'vmware.dataset_has_vms', ['APPS', false]);
  });
});
