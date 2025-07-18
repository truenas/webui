import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DataProtectionCardComponent } from 'app/pages/datasets/components/data-protection-card/data-protection-card.component';
import {
  DatasetCapacityManagementCardComponent,
} from 'app/pages/datasets/components/dataset-capacity-management-card/dataset-capacity-management-card.component';
import { DatasetDetailsCardComponent } from 'app/pages/datasets/components/dataset-details-card/dataset-details-card.component';
import { DatasetDetailsPanelComponent } from 'app/pages/datasets/components/dataset-details-panel/dataset-details-panel.component';
import { DatasetFormComponent } from 'app/pages/datasets/components/dataset-form/dataset-form.component';
import { DatasetIconComponent } from 'app/pages/datasets/components/dataset-icon/dataset-icon.component';
import { UsageCardComponent } from 'app/pages/datasets/components/usage-card/usage-card.component';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { ZfsEncryptionCardComponent } from 'app/pages/datasets/modules/encryption/components/zfs-encryption-card/zfs-encryption-card.component';
import { PermissionsCardComponent } from 'app/pages/datasets/modules/permissions/containers/permissions-card/permissions-card.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('DatasetDetailsPanelComponent', () => {
  let spectator: Spectator<DatasetDetailsPanelComponent>;
  let loader: HarnessLoader;

  const dataset = {
    id: 'root/parent/child',
    pool: 'my-pool',
    name: 'root/parent/child',
    mountpoint: '/mnt/root/parent/child',
    type: DatasetType.Filesystem,
    encrypted: true,
  } as DatasetDetails;

  const datasetDetails = {
    ...dataset,
  } as DatasetDetails;

  const parentDatasetDetails = {
    name: 'root/parent',
  } as DatasetDetails;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: DatasetDetailsPanelComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        DatasetIconComponent,
        DatasetDetailsCardComponent,
        PermissionsCardComponent,
        ZfsEncryptionCardComponent,
        DatasetCapacityManagementCardComponent,
        DataProtectionCardComponent,
        UsageCardComponent,
        MobileBackButtonComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockProvider(DatasetTreeStore, {
        selectedDataset$: of(datasetDetails),
        selectedParentDataset$: of(parentDatasetDetails),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'TrueNAS-SCALE-22.12',
            } as SystemInfo,
          },
        ],
      }),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef, slideInRef),
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

  it('shows a title of current dataset', () => {
    expect(spectator.query('.title .prefix')).toHaveText('Details for');
    expect(spectator.query('.title .mobile-prefix')).toHaveText('Details for');
    expect(spectator.query('.title .full-path')).toHaveText('child');
  });

  it('opens a dataset form when Add Dataset is pressed', async () => {
    const addDatasetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Dataset' }));
    await addDatasetButton.click();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      DatasetFormComponent,
      { data: { datasetId: 'root/parent/child', isNew: true }, wide: true },
    );
  });

  it('opens a zvol form when Add Zvol is pressed', async () => {
    const addZvolButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add Zvol' }));
    await addZvolButton.click();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(
      ZvolFormComponent,
      { data: { parentOrZvolId: 'root/parent/child', isNew: true } },
    );
  });

  it('shows all the cards', () => {
    const datasetDetailsCard = spectator.query(DatasetDetailsCardComponent)!;
    expect(datasetDetailsCard).toBeTruthy();
    expect(datasetDetailsCard.dataset).toBe(dataset);

    const dataProtectionCard = spectator.query(DataProtectionCardComponent)!;
    expect(dataProtectionCard).toBeTruthy();
    expect(dataProtectionCard.dataset).toStrictEqual(datasetDetails);

    const permissionsCard = spectator.query(PermissionsCardComponent)!;
    expect(permissionsCard).toBeTruthy();
    expect(permissionsCard.dataset).toStrictEqual(datasetDetails);

    const zfsEncryptionCard = spectator.query(ZfsEncryptionCardComponent)!;
    expect(zfsEncryptionCard).toBeTruthy();
    expect(zfsEncryptionCard.dataset).toStrictEqual(datasetDetails);

    const datasetCapacityManagementCard = spectator.query(DatasetCapacityManagementCardComponent)!;
    expect(datasetCapacityManagementCard).toBeTruthy();
    expect(datasetCapacityManagementCard.dataset).toStrictEqual(datasetDetails);
  });

  it('hides "Permissions Card" if dataset type is Volume', () => {
    spectator.setInput('dataset', {
      ...dataset,
      type: DatasetType.Volume,
    });
    expect(spectator.query('ix-permissions-card')).not.toBeVisible();
  });
});
