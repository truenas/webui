import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns-tz';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

const mockDatasets = [
  { name: 'APPS' },
  { name: 'POOL' },
] as Dataset[];

const slideInRef: SlideInRef<string | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn(() => undefined),
};

const mockNamingSchema = ['%Y %H %d %M %m'];

describe('SnapshotAddFormComponent', () => {
  let spectator: Spectator<SnapshotAddFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('zfs.snapshot.create'),
        mockCall('pool.dataset.query', mockDatasets),
        mockCall('replication.list_naming_schemas', mockNamingSchema),
        mockCall('pool.dataset.details'),
        mockCall('vmware.dataset_has_vms', true),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
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

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', false]);

    await form.fillForm({
      'VMWare Sync': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('zfs.snapshot.create', [
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

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', true]);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('zfs.snapshot.create', [
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

    expect(api.call).not.toHaveBeenCalledWith('zfs.snapshot.create');
  });

  it('re-checks for VMs in dataset when recursive checkbox is toggled or dataset changed', async () => {
    jest.clearAllMocks();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Dataset: 'POOL' });
    await form.fillForm({ Recursive: true });
    await form.fillForm({ Dataset: 'APPS' });
    await form.fillForm({ Recursive: false });

    expect(api.call).toHaveBeenNthCalledWith(1, 'vmware.dataset_has_vms', ['POOL', false]);
    expect(api.call).toHaveBeenNthCalledWith(2, 'vmware.dataset_has_vms', ['POOL', true]);
    expect(api.call).toHaveBeenNthCalledWith(3, 'vmware.dataset_has_vms', ['APPS', true]);
    expect(api.call).toHaveBeenNthCalledWith(4, 'vmware.dataset_has_vms', ['APPS', false]);
  });
});
