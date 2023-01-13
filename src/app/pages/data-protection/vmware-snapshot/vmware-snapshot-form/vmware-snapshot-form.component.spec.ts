import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket, mockWebsocket2 } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { MatchDatastoresWithDatasets, VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService2 } from 'app/services/ws2.service';
import { VmwareSnapshotFormComponent } from './vmware-snapshot-form.component';

describe('VmwareSnapshotFormComponent', () => {
  const existingSnapshot = {
    id: 1,
    datastore: 'ds01',
    filesystem: 'fs01',
    hostname: '192.168.30.4',
    password: 'pleasechange',
    username: 'root',
  } as VmwareSnapshot;

  let spectator: Spectator<VmwareSnapshotFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: VmwareSnapshotFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket(),
      mockWebsocket2([
        mockCall('vmware.match_datastores_with_datasets', {
          filesystems: [
            {
              type: DatasetType.Filesystem,
              name: 'fs01',
              description: 'filesysyem 01',
            },
            {
              type: DatasetType.Filesystem,
              name: 'fs02',
              description: 'filesysyem 02',
            },
          ],
          datastores: [
            {
              name: 'ds01',
              description: 'datastore 01',
              filesystems: ['fs01', 'fs02'],
            },
            {
              name: 'ds02',
              description: 'datastore 02',
              filesystems: ['fs02', 'fs01'],
            },
          ],
        } as MatchDatastoresWithDatasets),
        mockCall('vmware.create'),
        mockCall('vmware.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('creates a new vm snapshot task when new form is saved', async () => {
    await form.fillForm({
      Hostname: '192.168.30.4',
      Username: 'root',
      Password: 'pleasechange',
    });

    const fetchDatastoresButton = await loader.getHarness(MatButtonHarness.with({ text: 'Fetch DataStores' }));
    await fetchDatastoresButton.click();

    expect(spectator.inject(WebSocketService2).call).toHaveBeenCalledWith('vmware.match_datastores_with_datasets', [{
      hostname: '192.168.30.4',
      username: 'root',
      password: 'pleasechange',
    }]);

    await form.fillForm({
      Datastore: 'ds01',
    });
    const values = await form.getValues();
    expect(values['ZFS Filesystem']).toBe('fs01');

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService2).call).toHaveBeenCalledWith('vmware.create', [{
      hostname: '192.168.30.4',
      username: 'root',
      password: 'pleasechange',
      filesystem: 'fs01',
      datastore: 'ds01',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('shows values for an existing vm snapshot task when it is open for edit', async () => {
    spectator.component.setSnapshotForEdit(existingSnapshot);
    const values = await form.getValues();

    expect(values).toEqual({
      Hostname: '192.168.30.4',
      Username: 'root',
      Password: 'pleasechange',
      'ZFS Filesystem': 'fs01',
      Datastore: 'ds01',
    });
  });

  it('saves updated vm snapshot task when form opened for edit is saved', async () => {
    spectator.component.setSnapshotForEdit(existingSnapshot);
    await form.fillForm({
      Hostname: '192.168.30.4',
      Username: 'root',
      Password: 'pleasechange',
      'ZFS Filesystem': 'fs02',
      Datastore: 'ds01',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'The filesystem fs02 is filesysyem 02, but datastore ds01 is datastore 01. Is this correct?',
      }),
    );

    expect(spectator.inject(WebSocketService2).call).toHaveBeenCalledWith('vmware.update', [
      1,
      {
        hostname: '192.168.30.4',
        username: 'root',
        password: 'pleasechange',
        filesystem: 'fs02',
        datastore: 'ds01',
      },
    ]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
