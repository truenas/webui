import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';

const slideInRef: SlideInRef<string | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn((): undefined => undefined),
};

const mockNamingSchema = ['%Y %H %d %M %m'];

describe('SnapshotAddFormComponent', () => {
  let spectator: Spectator<SnapshotAddFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const clickSave = async (): Promise<void> => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
  };

  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.snapshot.create'),
        mockCall('pool.filesystem_choices', ['APPS', 'POOL']),
        mockCall('replication.list_naming_schemas', mockNamingSchema),
        mockCall('vmware.dataset_has_vms', true),
      ]),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
  });

  it('presets name with current date and time', async () => {
    const defaultName = await (await getInput('name')).getValue();

    // Use regex to avoid flaky test when minute boundary is crossed during test execution
    expect(defaultName).toMatch(/^manual-\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);
  });

  it('sends an update payload to websocket and closes modal when save is pressed', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('test-snapshot-name');

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', false]);

    await (await getCheckbox('vmware_sync')).check();

    await clickSave();

    expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
      {
        dataset: 'APPS',
        name: 'test-snapshot-name',
        recursive: false,
        vmware_sync: true,
      },
    ]);
  });

  it('checks when form is submitted with naming schema', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    spectator.component.form.controls.name.setValue('');
    await (await getCheckbox('recursive')).check();
    await (await getSelect('naming_schema')).selectOption('%Y %H %d %M %m');

    expect(api.call).toHaveBeenCalledWith('vmware.dataset_has_vms', ['APPS', true]);

    await clickSave();

    expect(api.call).toHaveBeenCalledWith('pool.snapshot.create', [
      {
        dataset: 'APPS',
        naming_schema: '%Y %H %d %M %m',
        recursive: true,
        vmware_sync: false,
      },
    ]);
  });

  it('should raise error when name and naming schema has values', async () => {
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getInput('name')).setValue('snapshot-name');
    await (await getSelect('naming_schema')).selectOption('%Y %H %d %M %m');

    await clickSave();

    expect(api.call).not.toHaveBeenCalledWith('pool.snapshot.create');
  });

  it('re-checks for VMs in dataset when recursive checkbox is toggled or dataset changed', async () => {
    jest.clearAllMocks();

    await (await getSelect('dataset')).selectOption('POOL');
    await (await getCheckbox('recursive')).check();
    await (await getSelect('dataset')).selectOption('APPS');
    await (await getCheckbox('recursive')).uncheck();

    expect(api.call).toHaveBeenNthCalledWith(1, 'vmware.dataset_has_vms', ['POOL', false]);
    expect(api.call).toHaveBeenNthCalledWith(2, 'vmware.dataset_has_vms', ['POOL', true]);
    expect(api.call).toHaveBeenNthCalledWith(3, 'vmware.dataset_has_vms', ['APPS', true]);
    expect(api.call).toHaveBeenNthCalledWith(4, 'vmware.dataset_has_vms', ['APPS', false]);
  });
});
