import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DeleteDatasetDialogComponent } from 'app/pages/datasets/components/delete-dataset-dialog/delete-dataset-dialog.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { DialogService, ModalService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const dataset = {
  id: 'pool/child',
  name: 'pool/child',
  pool: 'pool',
  type: DatasetType.Filesystem,
  sync: { value: 'STANDARD' },
  compression: { source: ZfsPropertySource.Inherited, value: 'LZ4' },
  atime: true,
  deduplication: { value: 'OFF' },
  casesensitive: false,
  comments: { value: 'Test comment', source: ZfsPropertySource.Local },
  origin: null,
} as DatasetDetails;

const zvol = {
  ...dataset,
  type: DatasetType.Volume,
} as DatasetDetails;

describe('DatasetDetailsCardComponent', () => {
  let spectator: Spectator<DatasetDetailsCardComponent>;
  let loader: HarnessLoader;
  const fakeModalRef = {
    setPk: jest.fn(),
    setVolId: jest.fn(),
    setTitle: jest.fn(),
  };
  const fakeSlideInRef = {
    zvolFormInit: jest.fn(),
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
        selectedParentDataset$: of({ id: 'pool' }),
      }),
      mockProvider(ModalService, {
        openInSlideIn: jest.fn(() => fakeModalRef),
        onClose$: of(),
      }),
      mockProvider(MatSnackBar),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => fakeSlideInRef),
        onClose$: of(),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockWebsocket([
        mockCall('pool.dataset.promote'),
      ]),
      mockProvider(Router),
      mockProvider(DialogService),
    ],
  });

  function setupTest(props: Partial<DatasetDetailsCardComponent> = {}): void {
    spectator = createComponent({ props });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  function getDetails(): Record<string, string> {
    return spectator.queryAll('.details-item').reduce((acc, item: HTMLElement) => {
      const key = item.querySelector('.label').textContent;
      const value = item.querySelector('.value').textContent;
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
  }

  it('shows header', () => {
    setupTest({ dataset });

    expect(spectator.query('mat-card-header h3')).toHaveText('Dataset Details');
    expect(spectator.query('mat-card-header button')).toHaveText('Edit');
  });

  describe('filesystem dataset', () => {
    it('shows filesystem details', () => {
      setupTest({ dataset });

      const details = getDetails();
      expect(details).toEqual({
        'Type:': ' FILESYSTEM ',
        'Sync:': ' STANDARD ',
        'Compression Level:': ' Inherit (LZ4) ',
        'Enable Atime:': ' ON ',
        'ZFS Deduplication:': ' OFF ',
        'Case Sensitivity:': ' OFF ',
        'Path:': ' pool/child ',
        'Comments:': 'Test comment',
      });
    });

    it('opens edit dataset form when Edit button is clicked', async () => {
      setupTest({ dataset });

      const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
      await editButton.click();

      expect(spectator.inject(ModalService).openInSlideIn).toHaveBeenCalledWith(DatasetFormComponent, dataset.id);
      expect(fakeModalRef.setPk).toHaveBeenCalledWith('pool/child');
      expect(fakeModalRef.setVolId).toHaveBeenCalledWith('pool');
      expect(fakeModalRef.setTitle).toHaveBeenCalledWith('Edit Dataset');
    });

    it('opens delete dataset dialog when Delete button is clicked', async () => {
      setupTest({ dataset });

      const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
      await deleteButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteDatasetDialogComponent, { data: dataset });
    });
  });

  describe('volume dataset', () => {
    it('shows zvol details', () => {
      setupTest({ dataset: zvol });

      const details = getDetails();
      expect(details).toEqual({
        'Type:': ' VOLUME ',
        'Sync:': ' STANDARD ',
        'Compression Level:': ' Inherit (LZ4) ',
        'ZFS Deduplication:': ' OFF ',
        'Case Sensitivity:': ' OFF ',
        'Path:': ' pool/child ',
        'Comments:': 'Test comment',
      });
    });

    it('opens edit zvol form when Edit Zvol button is clicked', async () => {
      setupTest({ dataset: zvol });

      const editZvolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit Zvol' }));
      await editZvolButton.click();
      expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ZvolFormComponent);
      expect(fakeSlideInRef.zvolFormInit).toHaveBeenCalledWith(false, 'pool/child');
    });
  });

  describe('promoting dataset', () => {
    it('does not show a Promote Dataset button when dataset cannot be promoted', async () => {
      setupTest({ dataset });

      const promoteButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Promote' }));
      expect(promoteButton).toBeNull();
    });

    it('promotes dataset when dataset can be promoted and Promote Dataset button is pressed', async () => {
      setupTest({
        dataset: {
          ...dataset,
          origin: {
            parsed: 'pool/origin',
          },
        } as DatasetDetails,
      });

      const promoteButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Promote' }));
      await promoteButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.promote', ['pool/child']);
    });
  });
});
