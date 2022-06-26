import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockCall, mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ImportDiskFilesystem } from 'app/enums/import-disk-filesystem-type.enum';
import { Job } from 'app/interfaces/job.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { JobService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { ImportDataComponent } from './import-data.component';

describe('ImportDataComponent', () => {
  let spectator: Spectator<ImportDataComponent>;
  const importJob = fakeSuccessfulJob();
  let loader: HarnessLoader;
  let form: IxFormHarness;
  // TODO: Change mockEntityJobComponentRef to a factory.
  const entityJobRef = { ...mockEntityJobComponentRef };
  entityJobRef.componentInstance.success = of(importJob) as unknown as EventEmitter<Job>;
  entityJobRef.componentInstance.aborted = of() as unknown as EventEmitter<Job>;
  const createComponent = createComponentFactory({
    component: ImportDataComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.import_disk_msdosfs_locales', ['koi8-u', 'utf8']),
        mockCall('pool.import_disk_autodetect_fs_type', ImportDiskFilesystem.Ntfs),
        mockCall('disk.get_unused', [
          {
            partitions: [
              { path: '/dev/sdk1' },
              { path: '/dev/sdk2' },
            ],
          },
          {
            partitions: [
              { path: '/dev/sdl1' },
            ],
          },
        ] as UnusedDisk[]),
        mockJob('pool.import_disk', importJob),
      ]),
      mockProvider(JobService),
      mockProvider(FilesystemService),
      mockProvider(MatDialog, {
        open: jest.fn(() => entityJobRef),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads and shows partitions available for import', async () => {
    const diskOptions = await form.getControl('Disk') as IxSelectHarness;

    expect(await diskOptions.getOptionLabels()).toEqual(['/dev/sdk1', '/dev/sdk2', '/dev/sdl1']);
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('disk.get_unused', [true]);
  });

  it('tries to auto-detect disk type when it is selected', async () => {
    await form.fillForm({ Disk: '/dev/sdk1' });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.import_disk_autodetect_fs_type', ['/dev/sdk1']);

    const formValues = await form.getValues();
    expect(formValues['Filesystem Type']).toEqual('NTFS');
  });

  it('shows locale select for MSDOS filesystem', async () => {
    await form.fillForm({
      'Filesystem Type': 'MSDOSFS',
    });

    const localeSelect = await form.getControl('MSDOSFS Locale') as IxSelectHarness;
    expect(await localeSelect.getOptionLabels()).toEqual(['--', 'koi8-u', 'utf8']);
  });

  it('imports a disk when form is submitted and shows logs', async () => {
    await form.fillForm({
      Disk: '/dev/sdk1',
      'Filesystem Type': 'NTFS',
      'Destination Path': '/mnt/dataset',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalled();
    expect(entityJobRef.componentInstance.setCall).toHaveBeenCalledWith(
      'pool.import_disk',
      ['/dev/sdk1', ImportDiskFilesystem.Ntfs, {}, '/mnt/dataset'],
    );
    expect(spectator.inject(JobService).showLogs).toHaveBeenCalledWith(importJob, 'Disk Imported: Log Summary');
  });

  it('sends locale when form is submitted with it for MSDOSFS', async () => {
    await form.fillForm({
      Disk: '/dev/sdk1',
      'Filesystem Type': 'MSDOSFS',
      'Destination Path': '/mnt/dataset',
    });
    await form.fillForm({
      'MSDOSFS Locale': 'koi8-u',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(entityJobRef.componentInstance.setCall).toHaveBeenCalledWith(
      'pool.import_disk',
      ['/dev/sdk1', ImportDiskFilesystem.Msdosfs, { locale: 'koi8-u' }, '/mnt/dataset'],
    );
  });

  it('adds a button that shows logs for last job when pressed', async () => {
    await form.fillForm({
      Disk: '/dev/sdk1',
      'Filesystem Type': 'NTFS',
      'Destination Path': '/mnt/dataset',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    jest.resetAllMocks();

    const logsButton = await loader.getHarness(MatButtonHarness.with({ text: 'View Import Log' }));
    await logsButton.click();

    expect(spectator.inject(JobService).showLogs).toHaveBeenCalledWith(importJob, 'Disk Imported: Log Summary');
  });
});
