import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { format } from 'date-fns-tz';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxInputHarness } from 'app/modules/ix-forms/components/ix-input/ix-input.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const mockDatasets = [
  { name: 'APPS' },
  { name: 'POOL' },
] as Dataset[];

const mockNamingSchema = ['%Y %H %d %M %m'];

describe('SnapshotAddFormComponent', () => {
  let spectator: Spectator<SnapshotAddFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;

  const createComponent = createComponentFactory({
    component: SnapshotAddFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('zfs.snapshot.create'),
        mockCall('pool.dataset.query', mockDatasets),
        mockCall('replication.list_naming_schemas', mockNamingSchema),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebsocketService);
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

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenLastCalledWith('zfs.snapshot.create', [
      {
        dataset: 'APPS',
        name: 'test-snapshot-name',
        recursive: false,
      },
    ]);
  });

  it('checks when form is submitted with naming schema', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Dataset: 'APPS',
      Name: null,
      'Naming Schema': '%Y %H %d %M %m',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenLastCalledWith('zfs.snapshot.create', [
      {
        dataset: 'APPS',
        naming_schema: '%Y %H %d %M %m',
        recursive: false,
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
});
