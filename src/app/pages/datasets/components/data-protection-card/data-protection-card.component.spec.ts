import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { DataProtectionCardComponent } from './data-protection-card.component';

describe('DataProtectionComponent', () => {
  let spectator: Spectator<DataProtectionCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DataProtectionCardComponent,
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
    ],
  });
  beforeEach(() => {
    spectator = createComponent({
      props: {
        dataset: {
          id: '/mnt/pool/ds',
          encrypted: false,
          snapshot_count: 2,
          snapshot_tasks_count: 3,
          replication_tasks_count: 4,
          cloudsync_tasks_count: 5,
          rsync_tasks_count: 6,
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
    const slideInRef = spectator.inject(SlideIn);

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Take Snapshot' }));
    await editButton.click();

    expect(slideInRef.open).toHaveBeenCalledWith(SnapshotAddFormComponent, { data: '/mnt/pool/ds' });
  });
});
