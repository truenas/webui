import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { format } from 'date-fns-tz';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { BackupTaskActionsComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-actions/backup-task-actions.component';
import { BackupTaskEmptyComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-empty/backup-task-empty.component';
import { BackupTaskTileComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/backup-task-tile/backup-task-tile.component';
import { WidgetBackupComponent } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.component';
import { WidgetBackupHarness } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.harness';

const currentDatetime = new Date();

const replicationTasks = [
  {
    id: 1,
    direction: Direction.Push,
    state: {
      state: JobState.Failed,
      datetime: {
        $date: currentDatetime.getTime() - 50000,
      },
    },
  },
  {
    id: 2,
    direction: Direction.Push,
    state: {
      state: JobState.Failed,
      datetime: {
        $date: currentDatetime.getTime() - 50000,
      },
    },
  },
  {
    id: 3,
    direction: Direction.Pull,
    state: {
      state: JobState.Failed,
      datetime: {
        $date: currentDatetime.getTime() - 50000,
      },
    },
  },
] as ReplicationTask[];

const rsyncTasks = [
  {
    id: 1,
    direction: Direction.Push,
    job: {
      id: 1,
      state: JobState.Success,
      time_finished: {
        $date: currentDatetime.getTime() - 10000,
      },
    },
  },
  {
    id: 2,
    direction: Direction.Pull,
    job: {
      id: 1,
      state: JobState.Success,
      time_finished: {
        $date: currentDatetime.getTime() - 1000 * 60 * 60 * 24 * 6,
      },
    },
  },
  {
    id: 3,
    direction: Direction.Pull,
    job: {
      id: 1,
      state: JobState.Success,
      time_finished: {
        $date: currentDatetime.getTime() - 1000 * 60 * 60 * 24 * 8,
      },
    },
  },
] as RsyncTask[];

const cloudSyncTasks = [
  {
    id: 1,
    direction: Direction.Push,
    job: {
      id: 1,
      state: JobState.Success,
      time_finished: {
        $date: currentDatetime.getTime() - 50000,
      },
    },
  },
  {
    id: 2,
    direction: Direction.Push,
    job: {
      id: 2,
      state: JobState.Success,
      time_finished: {
        $date: currentDatetime.getTime() - 30000,
      },
    },
  },
] as CloudSyncTask[];

describe('WidgetBackupComponent', () => {
  let spectator: Spectator<WidgetBackupComponent>;
  let widgetBackup: WidgetBackupHarness;

  const createComponent = createComponentFactory({
    component: WidgetBackupComponent,
    imports: [
      MatGridListModule,
    ],
    declarations: [
      BackupTaskTileComponent,
      BackupTaskEmptyComponent,
      BackupTaskActionsComponent,
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
    ],
  });

  describe('first mockup variation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getBackups: () => of([[], [], []]),
          }),
        ],
      });

      widgetBackup = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WidgetBackupHarness);
    });

    it('shows title', async () => {
      const header = await widgetBackup.getHeader();
      expect(header.title).toBe('Backup Tasks');
    });

    it('hides tiles when no data', async () => {
      expect(await widgetBackup.getTiles()).toBeNull();
      expect(await widgetBackup.getEmptyCardMessage()).toBe('Backup to Cloud or another TrueNAS via links below');
    });
  });

  describe('second mockup variation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getBackups: () => of([replicationTasks, rsyncTasks, cloudSyncTasks]),
          }),
        ],
      });

      widgetBackup = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WidgetBackupHarness);
    });

    it('shows tiles when data exists', async () => {
      expect(await widgetBackup.getEmptyCardMessage()).toBeNull();
      expect(await widgetBackup.getBannerMessage()).toBeNull();

      const tiles = await widgetBackup.getTiles();
      expect(tiles).toEqual({
        'Cloud Sync': {
          firstColumn: ['2 send tasks', '0 receive tasks', 'Total failed: 0'],
          secondColumn: ['2 sent tasks this week', '—', `Last successful: ${format(currentDatetime.getTime() - 30000, 'yyyy-MM-dd HH:mm:ss')}`],
        },
        Replication: {
          firstColumn: ['2 send tasks', '1 receive task', 'Total failed: 3'],
          secondColumn: ['—', '—', 'Last successful: Never'],
        },
        Rsync: {
          firstColumn: ['1 send task', '2 receive tasks', 'Total failed: 0'],
          secondColumn: ['1 sent task this week', '1 received task this week', `Last successful: ${format(currentDatetime.getTime() - 10000, 'yyyy-MM-dd HH:mm:ss')}`],
        },
      });
    });

    it('shows alert status when there are errors', async () => {
      const header = await widgetBackup.getHeader();
      expect(header.icon).toBe('mdi-alert');
      expect(header.message).toBe('3 of 8 tasks failed');
    });
  });

  describe('third mockup variation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getBackups: () => of([
              [{
                id: 1,
                direction: Direction.Pull,
                state: {
                  state: JobState.Success,
                  datetime: { $date: currentDatetime.getTime() - 50000 },
                },
              }] as ReplicationTask[],
              [{
                id: 1,
                direction: Direction.Push,
                job: {
                  state: JobState.Success,
                  time_finished: { $date: currentDatetime.getTime() - 50000 },
                },
              }] as RsyncTask[],
              [],
            ]),
          }),
        ],
      });

      widgetBackup = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WidgetBackupHarness);
    });

    it('shows backup actions only when one tile has received tasks', async () => {
      expect(await widgetBackup.getBannerMessage()).toBeNull();
      expect(await widgetBackup.getBackupActionMessages()).toEqual({
        Replication: 'Backup  to cloud  or  to another TrueNAS',
        Rsync: null,
      });
    });
  });

  describe('fourth mockup variation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getBackups: () => of([
              [{
                id: 1,
                direction: Direction.Pull,
                state: {
                  state: JobState.Success,
                  datetime: { $date: currentDatetime.getTime() - 50000 },
                },
              }],
              [{
                id: 1,
                direction: Direction.Push,
                job: {
                  state: JobState.Success,
                  time_finished: { $date: currentDatetime.getTime() - 50000 },
                },
              }] as RsyncTask[],
              [],
            ]),
          }),
        ],
      });

      widgetBackup = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WidgetBackupHarness);
    });

    it('shows backup actions only when one tile has received tasks', async () => {
      expect(await widgetBackup.getBannerMessage()).toBeNull();
      expect(await widgetBackup.getBackupActionMessages()).toEqual({
        Replication: 'Backup  to cloud  or  to another TrueNAS',
        Rsync: null,
      });
    });
  });

  describe('fifth mockup variation', () => {
    beforeEach(async () => {
      spectator = createComponent({
        props: {
          size: SlotSize.Full,
        },
        providers: [
          mockProvider(WidgetResourcesService, {
            getBackups: () => of([
              [],
              [],
              cloudSyncTasks,
            ]),
          }),
        ],
      });

      widgetBackup = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, WidgetBackupHarness);
    });

    it('shows success status when there are no errors', async () => {
      const header = await widgetBackup.getHeader();
      expect(header.icon).toBe('mdi-check-circle');
      expect(header.message).toBeFalsy();
    });
  });
});
