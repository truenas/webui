import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnEmptyComponent, TnEmptyHarness } from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Pool } from 'app/interfaces/pool.interface';
import {
  CloudBackupCardComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-card/cloud-backup-card.component';
import { CloudSyncTaskCardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-task-card/cloudsync-task-card.component';
import { DataProtectionDashboardComponent } from 'app/pages/data-protection/data-protection-dashboard.component';
import { ReplicationTaskCardComponent } from 'app/pages/data-protection/replication/replication-task-card/replication-task-card.component';
import { RsyncTaskCardComponent } from 'app/pages/data-protection/rsync-task/rsync-task-card/rsync-task-card.component';
import { SnapshotTaskCardComponent } from 'app/pages/data-protection/snapshot-task/snapshot-task-card/snapshot-task-card.component';

describe('DataProtectionDashboardComponent', () => {
  let spectator: Spectator<DataProtectionDashboardComponent>;

  // pool.query is called with { count: true }, so it resolves to a number.
  let poolCount: unknown = 1;

  const createComponent = createComponentFactory({
    component: DataProtectionDashboardComponent,
    declarations: [
      MockComponents(
        CloudBackupCardComponent,
        CloudSyncTaskCardComponent,
        SnapshotTaskCardComponent,
        RsyncTaskCardComponent,
        ReplicationTaskCardComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('pool.query', () => poolCount as Pool[]),
      ]),
    ],
    imports: [TnEmptyComponent],
  });

  beforeEach(() => {
    poolCount = 1;
    spectator = createComponent();
  });

  it('renders data protection cards', () => {
    expect(spectator.query(CloudBackupCardComponent)).toExist();
    expect(spectator.query(CloudSyncTaskCardComponent)).toExist();
    expect(spectator.query(SnapshotTaskCardComponent)).toExist();
    expect(spectator.query(RsyncTaskCardComponent)).toExist();
    expect(spectator.query(ReplicationTaskCardComponent)).toExist();
  });

  describe('when there are no pools', () => {
    beforeEach(() => {
      poolCount = 0;
      spectator = createComponent();
    });

    it('shows the empty state with the catalog description, markup stripped', async () => {
      const empty = await TestbedHarnessEnvironment.loader(spectator.fixture).getHarness(TnEmptyHarness);

      expect(await empty.getTitle()).toBe('No Data Protection Tasks');
      expect(await empty.getDescription()).toBe(
        'This page will help you protect your data by syncing it with other systems on the cloud.'
        + ' But first, you need to create a storage pool to get started.',
      );
    });

    // The action is hosted outside tn-empty precisely to keep this id — see the template.
    it('keeps the legacy button-create-pool test id on the action', () => {
      expect(spectator.query('[data-test="button-create-pool"]')).toExist();
    });
  });
});
