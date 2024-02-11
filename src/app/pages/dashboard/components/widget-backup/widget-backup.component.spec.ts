import { MatGridListModule } from '@angular/material/grid-list';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
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
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { WidgetBackupComponent } from 'app/pages/dashboard/components/widget-backup/widget-backup.component';

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

  const createComponent = createComponentFactory({
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

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows title', () => {
    expect(spectator.query('.card-title-text').textContent).toBe('Backup Tasks');
  });

  it('hides tiles when no data', () => {
    expect(spectator.query('.card-content')).toBeNull();
    expect(spectator.query('.empty-card-content')).not.toBeNull();

    expect(spectator.query('.backup-actions').textContent.trim()).toBe('Backup to Cloud or another TrueNAS via links below');
  });

  it('shows tiles when data exists', () => {
    spectator.inject(MockWebSocketService).mockCall('replication.query', replicationTasks);
    spectator.inject(MockWebSocketService).mockCall('rsynctask.query', rsyncTasks);
    spectator.inject(MockWebSocketService).mockCall('cloudsync.query', cloudSyncTasks);
    spectator.component.getBackups();
    spectator.detectChanges();

    expect(spectator.query('.empty-card-content')).toBeNull();
    expect(spectator.query('.banner')).toBeNull();

    const tiles = spectator.queryAll('.tile');
    expect(tiles).toHaveLength(3);

    expect(tiles[0].querySelector('.title').textContent).toBe('Cloud Sync');
    expect(tiles[0].querySelectorAll('.label')[0].textContent.trim()).toBe('2 send tasks');
    expect(tiles[0].querySelectorAll('.label')[1].textContent.trim()).toBe('0 receive tasks');
    expect(tiles[0].querySelectorAll('.label')[2].textContent.trim()).toBe('Total failed: 0');
    expect(tiles[0].querySelectorAll('.label')[3].textContent.trim()).toBe('2 successful tasks this week');
    expect(tiles[0].querySelectorAll('.label')[4].textContent.trim()).toBe('0 successful tasks this week');
    expect(tiles[0].querySelectorAll('.label')[5].textContent.trim()).toBe(
      `Last successful: ${format(currentDatetime.getTime() - 30000, 'yyyy-MM-dd HH:mm:ss')}`,
    );

    expect(tiles[1].querySelector('.title').textContent).toBe('Replication');
    expect(tiles[1].querySelectorAll('.label')[0].textContent.trim()).toBe('2 send tasks');
    expect(tiles[1].querySelectorAll('.label')[1].textContent.trim()).toBe('1 receive task');
    expect(tiles[1].querySelectorAll('.label')[2].textContent.trim()).toBe('Total failed: 3');
    expect(tiles[1].querySelectorAll('.label')[3].textContent.trim()).toBe('0 successful tasks this week');
    expect(tiles[1].querySelectorAll('.label')[4].textContent.trim()).toBe('0 successful tasks this week');
    expect(tiles[1].querySelectorAll('.label')[5].textContent.trim()).toBe('Last successful: Never');

    expect(tiles[2].querySelector('.title').textContent).toBe('Rsync');
    expect(tiles[2].querySelectorAll('.label')[0].textContent.trim()).toBe('1 send task');
    expect(tiles[2].querySelectorAll('.label')[1].textContent.trim()).toBe('2 receive tasks');
    expect(tiles[2].querySelectorAll('.label')[2].textContent.trim()).toBe('Total failed: 0');
    expect(tiles[2].querySelectorAll('.label')[3].textContent.trim()).toBe('1 successful task this week');
    expect(tiles[2].querySelectorAll('.label')[4].textContent.trim()).toBe('1 successful task this week');
    expect(tiles[2].querySelectorAll('.label')[5].textContent.trim()).toBe(
      `Last successful: ${format(currentDatetime.getTime() - 10000, 'yyyy-MM-dd HH:mm:ss')}`,
    );
  });

  it('shows banner with backup actions below when tasks only received', () => {
    spectator.inject(MockWebSocketService).mockCall('replication.query', [{
      id: 1,
      direction: Direction.Pull,
      state: {
        state: JobState.Success,
        datetime: { $date: currentDatetime.getTime() - 50000 },
      },
    }]);
    spectator.inject(MockWebSocketService).mockCall('rsynctask.query', [{
      id: 1,
      direction: Direction.Pull,
      state: {
        state: JobState.Success,
        datetime: { $date: currentDatetime.getTime() - 50000 },
      },
    }]);
    spectator.component.getBackups();
    spectator.detectChanges();

    const tiles = spectator.queryAll('.tile');
    expect(tiles).toHaveLength(2);

    expect(tiles[0].querySelector('.backup-actions')).toBeNull();
    expect(tiles[1].querySelector('.backup-actions')).toBeNull();

    expect(spectator.query('.banner')).not.toBeNull();
    expect(spectator.query('.banner').textContent.trim()).toBe('Backup  to cloud  or  to another TrueNAS');
  });

  it('shows backup actions only when one tile has received tasks', () => {
    spectator.inject(MockWebSocketService).mockCall('replication.query', [{
      id: 1,
      direction: Direction.Pull,
      state: {
        state: JobState.Success,
        datetime: { $date: currentDatetime.getTime() - 50000 },
      },
    }]);
    spectator.inject(MockWebSocketService).mockCall('rsynctask.query', [{
      id: 1,
      direction: Direction.Push,
      state: {
        state: JobState.Success,
        datetime: { $date: currentDatetime.getTime() - 50000 },
      },
    }]);
    spectator.component.getBackups();
    spectator.detectChanges();

    expect(spectator.query('.banner')).toBeNull();

    const tiles = spectator.queryAll('.tile');
    expect(tiles).toHaveLength(2);

    expect(tiles[0].querySelector('.backup-actions').textContent.trim()).toBe('Backup  to cloud  or  to another TrueNAS');
    expect(tiles[1].querySelector('.backup-actions')).toBeNull();
  });

  it('shows alert status when there are errors', () => {
    spectator.inject(MockWebSocketService).mockCall('replication.query', replicationTasks);
    spectator.inject(MockWebSocketService).mockCall('rsynctask.query', rsyncTasks);
    spectator.inject(MockWebSocketService).mockCall('cloudsync.query', cloudSyncTasks);
    spectator.component.getBackups();
    spectator.detectChanges();

    expect(spectator.query(IxIconComponent).name).toBe('mdi-alert');
    expect(spectator.query('.status-container').textContent.trim()).toBe('3 of 8 tasks failed');
  });

  it('shows success status when there are no errors', () => {
    spectator.inject(MockWebSocketService).mockCall('cloudsync.query', cloudSyncTasks);
    spectator.component.getBackups();
    spectator.detectChanges();

    expect(spectator.query(IxIconComponent).name).toBe('mdi-check-circle');
    expect(spectator.query('.status-container').textContent).toBeFalsy();
  });
});
