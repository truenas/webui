import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ModalService } from 'app/services';

const dataset = {
  id: 'pool/child',
  name: 'pool/child',
  pool: 'pool',
  type: DatasetType.Filesystem,
  sync: { value: 'STANDARD' },
  compression: { source: ZfsPropertySource.Inherited, value: 'LZ4' },
  atime: false,
  deduplication: { value: 'OFF' },
  casesensitive: false,
  comments: { value: 'Test comment', source: ZfsPropertySource.Local },
} as DatasetDetails;

describe('DatasetDetailsCardComponent', () => {
  let spectator: Spectator<DatasetDetailsCardComponent>;
  let loader: HarnessLoader;
  const fakeModalRef = {
    setPk: jest.fn(),
    setVolId: jest.fn(),
    setTitle: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: DatasetDetailsCardComponent,
    declarations: [
      MockComponents(
        DatasetFormComponent,
        NgxSkeletonLoaderComponent,
        CopyButtonComponent,
      ),
    ],
    providers: [
      mockProvider(DatasetTreeStore, {
        datasetUpdated: jest.fn(),
      }),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => fakeModalRef),
        onClose$: of(),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Dataset Details');
    expect(spectator.query('mat-card-header button')).toHaveText('Edit');
  });

  it('shows details', () => {
    const details = spectator.queryAll('.details-item');
    expect(details.length).toEqual(8);

    expect(details[0].querySelector('.label')).toHaveText('Type:');
    expect(details[0].querySelector('.value')).toHaveText('FILESYSTEM');

    expect(details[1].querySelector('.label')).toHaveText('Sync:');
    expect(details[1].querySelector('.value')).toHaveText('STANDARD');

    expect(details[2].querySelector('.label')).toHaveText('Compression Level:');
    expect(details[2].querySelector('.value')).toHaveText('Inherit (LZ4)');

    expect(details[3].querySelector('.label')).toHaveText('Enable Atime:');
    expect(details[3].querySelector('.value')).toHaveText('OFF');

    expect(details[4].querySelector('.label')).toHaveText('ZFS Deduplication:');
    expect(details[4].querySelector('.value')).toHaveText('OFF');

    expect(details[5].querySelector('.label')).toHaveText('Case Sensitivity:');
    expect(details[5].querySelector('.value')).toHaveText('OFF');

    expect(details[6].querySelector('.label')).toHaveText('Path:');
    expect(details[6].querySelector('.value')).toHaveText('pool/child');

    expect(details[7].querySelector('.label')).toHaveText('Comments:');
    expect(details[7].querySelector('.value')).toHaveText('Test comment');
  });

  it('opens edit dataset form when Edit button is clicked', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(ModalService).openInSlideIn).toHaveBeenCalledWith(DatasetFormComponent, dataset.id);
    expect(fakeModalRef.setPk).toHaveBeenCalledWith('pool/child');
    expect(fakeModalRef.setVolId).toHaveBeenCalledWith('pool');
    expect(fakeModalRef.setTitle).toHaveBeenCalledWith('Edit Dataset');
  });

  it('opens delete dataset dialog when Delete button is clicked', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteDatasetDialogComponent, { data: dataset });
  });
});
