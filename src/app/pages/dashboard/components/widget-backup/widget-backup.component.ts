import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { differenceInDays } from 'date-fns';
import { filter, forkJoin, map } from 'rxjs';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

enum BackupType {
  CloudSync = 'Cloud Sync',
  Rsync = 'Rsync',
  Replication = 'Replication',
}

interface BackupRow {
  type: BackupType;
  timestamp: ApiTimestamp;
  state: JobState;
  direction: Direction;
}

interface BackupTile {
  title: string;
  totalSend: number;
  totalReceive: number;
  failedSend: number;
  failedReceive: number;
  lastWeekSend: number;
  lastWeekReceive: number;
  lastSuccessfulTask: ApiTimestamp;
}

@UntilDestroy()
@Component({
  selector: 'ix-widget-backup',
  templateUrl: './widget-backup.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-backup.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetBackupComponent extends WidgetComponent implements OnInit {
  isMobile$ = this.breakpointObserver.observe([Breakpoints.XSmall]).pipe(map((state) => state.matches));
  backups: BackupRow[] = [];
  isLoading = false;

  successStates = [JobState.Success, JobState.Finished];
  failedStates = [JobState.Failed, JobState.Error, JobState.Aborted];

  trackByTile: TrackByFunction<BackupTile> = (_, tile) => tile.title;

  get allCount(): number {
    return this.backups.length;
  }

  get failedCount(): number {
    return this.backups.filter((backup) => this.failedStates.includes(backup.state)).length;
  }

  get replicationTasks(): BackupRow[] {
    return this.backups.filter((backup) => backup.type === BackupType.Replication);
  }

  get cloudSyncTasks(): BackupRow[] {
    return this.backups.filter((backup) => backup.type === BackupType.CloudSync);
  }

  get rsyncTasks(): BackupRow[] {
    return this.backups.filter((backup) => backup.type === BackupType.Rsync);
  }

  get backupsTiles(): BackupTile[] {
    const tiles: BackupTile[] = [];
    if (this.cloudSyncTasks.length) {
      tiles.push(this.getTile(this.translate.instant('Cloud Sync'), this.cloudSyncTasks));
    }

    if (this.replicationTasks.length) {
      tiles.push(this.getTile(this.translate.instant('Replication'), this.replicationTasks));
    }

    if (this.rsyncTasks.length) {
      tiles.push(this.getTile(this.translate.instant('Rsync'), this.rsyncTasks));
    }
    return tiles;
  }

  get hasSendTasks(): boolean {
    return this.backups.some((backup) => this.isSendTask(backup));
  }

  constructor(
    public translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private chainedSlideInService: IxChainedSlideInService,
    private breakpointObserver: BreakpointObserver,
  ) {
    super(translate);
  }

  ngOnInit(): void {
    this.getBackups();
  }

  getBackups(): void {
    this.isLoading = true;
    forkJoin([
      this.ws.call('replication.query'),
      this.ws.call('rsynctask.query'),
      this.ws.call('cloudsync.query'),
    ]).pipe(untilDestroyed(this)).subscribe(([replicationTasks, rsyncTasks, cloudSyncTasks]) => {
      this.isLoading = false;
      this.backups = [
        ...replicationTasks.map((task) => ({
          type: BackupType.Replication,
          direction: task.direction,
          state: task.state.state,
          timestamp: task.state.datetime,
        })),
        ...rsyncTasks.map((task) => ({
          type: BackupType.Rsync,
          direction: task.direction,
          state: task.job?.state || (task.locked ? JobState.Locked : JobState.Pending),
          timestamp: task.job?.time_finished,
        })),
        ...cloudSyncTasks.map((task) => ({
          type: BackupType.CloudSync,
          direction: task.direction,
          state: task.job?.state || (task.locked ? JobState.Locked : JobState.Pending),
          timestamp: task.job?.time_finished,
        })),
      ];
      this.cdr.markForCheck();
    });
  }

  addCloudSyncTask(): void {
    this.chainedSlideInService.pushComponent(
      CloudSyncWizardComponent,
      true,
    ).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getBackups();
      },
    });
  }

  addReplicationTask(): void {
    const closer$ = this.chainedSlideInService.pushComponent(ReplicationWizardComponent, true);
    closer$.pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getBackups());
  }

  addRsyncTask(): void {
    const closer$ = this.chainedSlideInService.pushComponent(RsyncTaskFormComponent, true);
    closer$.pipe(filter((response) => !!response.response), untilDestroyed(this)).subscribe(() => this.getBackups());
  }

  private getTile(title: string, tasks: BackupRow[]): BackupTile {
    const successfulTasks = tasks.filter((backup) => this.successStates.includes(backup.state));
    const lastSuccessfulTask = successfulTasks
      .sort((a, b) => b.timestamp.$date - a.timestamp.$date)[0]?.timestamp;

    return {
      title,
      totalSend: tasks.filter((backup) => this.isSendTask(backup)).length,
      totalReceive: tasks.filter((backup) => !this.isSendTask(backup)).length,
      failedSend: tasks
        .filter((backup) => this.failedStates.includes(backup.state) && this.isSendTask(backup)).length,
      failedReceive: tasks
        .filter((backup) => this.failedStates.includes(backup.state) && !this.isSendTask(backup)).length,
      lastWeekSend: successfulTasks
        .filter((backup) => this.isSendTask(backup) && this.isThisWeek(backup.timestamp)).length,
      lastWeekReceive: successfulTasks
        .filter((backup) => !this.isSendTask(backup) && this.isThisWeek(backup.timestamp)).length,
      lastSuccessfulTask,
    };
  }

  private isSendTask(backup: BackupRow): boolean {
    return backup.direction === Direction.Push;
  }

  private isThisWeek(timestamp: ApiTimestamp): boolean {
    return differenceInDays((new Date()).getTime(), timestamp.$date) < 7;
  }
}
