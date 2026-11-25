import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { DataProtectionCardComponent } from './data-protection-card.component';

describe('DataProtectionComponent', () => {
  let spectator: Spectator<DataProtectionCardComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: DataProtectionCardComponent,
    providers: [
      mockAuth(),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
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
    expect(spectator.query('.backup-tasks.value')).toHaveText('');
  });

  it('lists the backup tasks there are', () => {
    expect(spectator.query('.backup-tasks')).toHaveText('4 Replication Tasks, 5 Cloud Sync Tasks, 6 Rsync Tasks');
  });

  it('says there are no backup tasks when every count is known and zero', () => {
    spectator.setInput('dataset', {
      id: '/mnt/pool/ds', replication_tasks_count: 0, cloudsync_tasks_count: 0, rsync_tasks_count: 0,
    } as DatasetDetails);

    expect(spectator.query('.backup-tasks')).toHaveText('No Backup Tasks');
  });

  it('hides the rows for counts the user may not see', () => {
    spectator.setInput('dataset', {
      id: '/mnt/pool/ds',
      snapshot_count: null,
      snapshot_tasks_count: null,
      replication_tasks_count: 0,
      cloudsync_tasks_count: null,
      rsync_tasks_count: 0,
    } as DatasetDetails);

    expect(spectator.query('.total-snapshots')).not.toExist();
    expect(spectator.query('.snapshot-tasks')).not.toExist();
    expect(spectator.query('.backup-tasks')).not.toExist();
  });

  it('still lists the backup tasks it knows of when one count is hidden', () => {
    spectator.setInput('dataset', {
      id: '/mnt/pool/ds', replication_tasks_count: 1, cloudsync_tasks_count: null, rsync_tasks_count: 0,
    } as DatasetDetails);

    expect(spectator.query('.backup-tasks')).toHaveText('1 Replication Task');
  });

  it('opens the snapshot add from when button clicked', async () => {
    const formPanel = spectator.inject(FormSidePanelService);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Take Snapshot' }));
    await editButton.click();

    expect(formPanel.open).toHaveBeenCalledWith(SnapshotAddFormComponent, {
      title: 'Add Snapshot',
      inputs: { presetDatasetId: '/mnt/pool/ds' },
    });
  });
});
