import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { DataProtectionCardComponent } from './data-protection-card.component';

describe('DataProtectionComponent', () => {
  let spectator: Spectator<DataProtectionCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DataProtectionCardComponent,
  });
  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset: {
          id: '/mnt/pool/ds',
          encrypted: false,
          available: null,
          encryption_algorithm: null,
          snapshot_count: 2,
          snapshot_tasks_count: 3,
          replication_tasks_count: 4,
          cloudsync_tasks_count: 5,
          rsync_tasks_count: 6,
          encryption_root: null,
          key_format: null,
          key_loaded: null,
          locked: null,
          mountpoint: null,
          name: null,
          pool: null,
          type: null,
          used: null,
          quota: null,
          thick_provisioned: false,
        } as DatasetDetails,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders component values', () => {
    expect(spectator.query('.total-snapshots.value')).toHaveText('2');
    expect(spectator.query('.snapshot-tasks.value')).toHaveText('3');
    expect(spectator.query('.replication-tasks.value')).toHaveText('4');
    expect(spectator.query('.cloudsync-tasks.value')).toHaveText('5');
    expect(spectator.query('.rsync-tasks.value')).toHaveText('6');
  });

  it('opens the snapshot add from when button clicked', async () => {
    const ixSlideInService = spectator.inject(IxSlideInService);
    jest.spyOn(ixSlideInService, 'open').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create Snapshot' }));
    await editButton.click();

    expect(ixSlideInService.open).toHaveBeenCalledWith(SnapshotAddFormComponent);
  });
});
