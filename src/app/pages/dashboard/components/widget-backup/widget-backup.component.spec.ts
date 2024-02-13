import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createHostFactory } from '@ngneat/spectator/jest';
import { format } from 'date-fns-tz';
import { MockComponent } from 'ng-mocks';
import { DragHandleComponent } from 'app/core/components/drag-handle/drag-handle.component';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { CloudSyncTask } from 'app/interfaces/cloud-sync-task.interface';
import { ReplicationTask } from 'app/interfaces/replication-task.interface';
import { RsyncTask } from 'app/interfaces/rsync-task.interface';
import { WidgetBackupComponent } from 'app/pages/dashboard/components/widget-backup/widget-backup.component';
import { WidgetBackupHarness } from 'app/pages/dashboard/components/widget-backup/widget-backup.harness';

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
  let loader: HarnessLoader;
  let widgetBackup: WidgetBackupHarness;

  const createHost = createHostFactory({
    component: WidgetBackupComponent,
    imports: [
      MatGridListModule,
    ],
    declarations: [
      MockComponent(DragHandleComponent),
      FakeFormatDateTimePipe,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('replication.query', []),
        mockCall('rsynctask.query', []),
        mockCall('cloudsync.query', []),
      ]),
    ],
  });

  function setupTasks(tasks: {
    replicationTasks?: ReplicationTask[];
    rsyncTasks?: RsyncTask[];
    cloudSyncTasks?: CloudSyncTask[];
  }): void {
    spectator.inject(MockWebSocketService).mockCall('replication.query', tasks.replicationTasks || []);
    spectator.inject(MockWebSocketService).mockCall('rsynctask.query', tasks.rsyncTasks || []);
    spectator.inject(MockWebSocketService).mockCall('cloudsync.query', tasks.cloudSyncTasks || []);
    spectator.component.getBackups();
    spectator.detectChanges();
  }

  beforeEach(async () => {
    spectator = createHost('<ix-widget-backup></ix-widget-backup>');
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    widgetBackup = await loader.getHarness(WidgetBackupHarness);
  });

  it('shows title', async () => {
    const header = await widgetBackup.getHeader();
    expect(header.title).toBe('Backup Tasks');
  });

  it('hides tiles when no data', async () => {
    expect(await widgetBackup.getTiles()).toBeNull();
    expect(await widgetBackup.getEmptyCardMessage()).toBe('Backup to Cloud or another TrueNAS via links below');
  });

  it('shows tiles when data exists', async () => {
    setupTasks({ replicationTasks, rsyncTasks, cloudSyncTasks });

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

  it('shows banner with backup actions below when tasks only received', async () => {
    setupTasks({
      replicationTasks: [{
        id: 1,
        direction: Direction.Pull,
        state: {
          state: JobState.Success,
          datetime: { $date: currentDatetime.getTime() - 50000 },
        },
      }] as ReplicationTask[],
      rsyncTasks: [{
        id: 1,
        direction: Direction.Pull,
        job: {
          state: JobState.Success,
          time_finished: { $date: currentDatetime.getTime() - 50000 },
        },
      }] as RsyncTask[],
    });

    expect(await widgetBackup.getBackupActionMessages()).toEqual({
      Replication: null,
      Rsync: null,
    });
    expect(await widgetBackup.getBannerMessage()).toBe('Backup  to cloud  or  to another TrueNAS');
  });

  it('shows backup actions only when one tile has received tasks', async () => {
    setupTasks({
      replicationTasks: [{
        id: 1,
        direction: Direction.Pull,
        state: {
          state: JobState.Success,
          datetime: { $date: currentDatetime.getTime() - 50000 },
        },
      }] as ReplicationTask[],
      rsyncTasks: [{
        id: 1,
        direction: Direction.Push,
        job: {
          state: JobState.Success,
          time_finished: { $date: currentDatetime.getTime() - 50000 },
        },
      }] as RsyncTask[],
    });

    expect(await widgetBackup.getBannerMessage()).toBeNull();
    expect(await widgetBackup.getBackupActionMessages()).toEqual({
      Replication: 'Backup  to cloud  or  to another TrueNAS',
      Rsync: null,
    });
  });

  it('shows alert status when there are errors', async () => {
    setupTasks({ replicationTasks, rsyncTasks, cloudSyncTasks });

    const header = await widgetBackup.getHeader();
    expect(header.icon).toBe('mdi-alert');
    expect(header.message).toBe('3 of 8 tasks failed');
  });

  it('shows success status when there are no errors', async () => {
    setupTasks({ cloudSyncTasks });

    const header = await widgetBackup.getHeader();
    expect(header.icon).toBe('mdi-check-circle');
    expect(header.message).toBeFalsy();
  });
});
