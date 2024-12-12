import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, throwError } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxHarness } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.harness';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { ApiService } from 'app/services/websocket/api.service';
import { DeleteDatasetDialogComponent } from './delete-dataset-dialog.component';

describe('DeleteDatasetDialogComponent', () => {
  let spectator: Spectator<DeleteDatasetDialogComponent>;
  let api: ApiService;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DeleteDatasetDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          id: 'lab1',
          name: 'Lab 1',
        } as VolumesListDataset,
      },
      mockProvider(MatDialogRef),
      mockApi([
        mockCall('pool.dataset.delete'),
        mockCall('pool.dataset.attachments', [
          {
            type: 'SMB Share',
            attachments: ['root'],
          },
          {
            type: 'NFS Share',
            attachments: [
              '/mnt/lab1/test, /mnt/lab1/t/test',
            ],
          },
        ] as DatasetAttachment[]),
        mockCall('pool.dataset.processes', [
          { name: 'zsh' },
          { name: 'ganesha.nfsd' },
          { pid: '1234', cmdline: 'rm -rf /' },
          { cmdline: 'nano' },
        ] as Process[]),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function confirmAndDelete(): Promise<void> {
    const confirmInput = await loader.getHarness(IxInputHarness);
    await confirmInput.setValue('Lab 1');

    const confirmCheckbox = await loader.getHarness(IxCheckboxHarness);
    await confirmCheckbox.setValue(true);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete Dataset' }));
    await deleteButton.click();
  }

  it('loads and shows services that use dataset', () => {
    expect(api.call).toHaveBeenCalledWith('pool.dataset.attachments', ['lab1']);

    const attachmentsSection = spectator.query('.attachments');
    expect(attachmentsSection).toHaveText(
      'These services depend on dataset Lab 1 and will be destroyed if the dataset is deleted:',
    );

    const services = attachmentsSection.querySelectorAll('.services > li');
    expect(services).toHaveLength(2);
    expect(services[0]).toHaveDescendantWithText({
      selector: '.service-name',
      text: 'SMB Share',
    });
    const smbAttachments = services[0].querySelectorAll('li');
    expect(smbAttachments).toHaveLength(1);
    expect(smbAttachments[0]).toHaveText('root');

    expect(services[1]).toHaveDescendantWithText({
      selector: '.service-name',
      text: 'NFS Share',
    });
    const nfsAttachments = services[1].querySelectorAll('li');
    expect(nfsAttachments).toHaveLength(2);
    expect(nfsAttachments[0]).toHaveText('/mnt/lab1/test');
    expect(nfsAttachments[1]).toHaveText('/mnt/lab1/t/test');
  });

  it('loads and shows known processes that use dataset', () => {
    expect(api.call).toHaveBeenCalledWith('pool.dataset.processes', ['lab1']);

    const processesSection = spectator.query('.known-processes');
    expect(processesSection).toHaveText('These running processes are using Lab 1:');
    const processes = processesSection.querySelectorAll('li');

    expect(processes).toHaveLength(2);
    expect(processes[0]).toHaveText('zsh');
    expect(processes[1]).toHaveText('ganesha.nfsd');
  });

  it('shows unknown processes that use dataset', () => {
    const processesSection = spectator.query('.unknown-processes');
    expect(processesSection).toHaveText('These unknown processes are using the dataset:');
    const processes = processesSection.querySelectorAll('li');

    expect(processes).toHaveLength(2);
    expect(processes[0]).toHaveText('1234 - rm -rf /');
    expect(processes[1]).toHaveText('Unknown PID - nano');
  });

  it('deletes dataset and closes modal when deletion is confirmed', async () => {
    await confirmAndDelete();

    expect(api.call).toHaveBeenCalledWith('pool.dataset.delete', ['lab1', { recursive: true }]);
  });

  it('asks to force delete a dataset if it cannot be deleted because device is busy', async () => {
    const websocketMock = spectator.inject(MockApiService);
    jest.spyOn(websocketMock, 'call').mockImplementationOnce(() => throwError(() => ({
      jsonrpc: '2.0',
      error: {
        data: {
          reason: 'Device busy',
        },
      },
    })));

    await confirmAndDelete();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Device Busy',
    }));
    expect(api.call).toHaveBeenCalledWith('pool.dataset.delete', ['lab1', { recursive: true, force: true }]);
  });
});
