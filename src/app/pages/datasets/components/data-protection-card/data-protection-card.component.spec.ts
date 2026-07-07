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

  it('opens the snapshot add form when button clicked', async () => {
    const formPanel = spectator.inject(FormSidePanelService);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Take Snapshot' }));
    await editButton.click();

    expect(formPanel.open).toHaveBeenCalledWith(SnapshotAddFormComponent, {
      title: 'Add Snapshot',
      inputs: { datasetPreset: '/mnt/pool/ds' },
    });
  });
});
