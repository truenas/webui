import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction,
  input,
} from '@angular/core';
import { MatIconAnchor } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { differenceInDays } from 'date-fns';
import { filter } from 'rxjs';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { BackupTile } from 'app/interfaces/cloud-backup.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { backupTasksWidget } from 'app/pages/dashboard/widgets/backup/widget-backup/widget-backup.definition';
import { CloudSyncWizardComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/cloudsync-wizard.component';
import { ReplicationWizardComponent } from 'app/pages/data-protection/replication/replication-wizard/replication-wizard.component';
import { RsyncTaskFormComponent } from 'app/pages/data-protection/rsync-task/rsync-task-form/rsync-task-form.component';
import { BackupTaskActionsComponent } from './backup-task-actions/backup-task-actions.component';
import { BackupTaskEmptyComponent } from './backup-task-empty/backup-task-empty.component';
import { BackupTaskTileComponent } from './backup-task-tile/backup-task-tile.component';

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

@UntilDestroy()
@Component({
  selector: 'ix-widget-backup',
  templateUrl: './widget-backup.component.html',
  styleUrls: [
    './widget-backup.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    IxIconComponent,
    MatIconAnchor,
    TestDirective,
    MatTooltip,
    RouterLink,
    MatGridList,
    MatGridTile,
    BackupTaskTileComponent,
    BackupTaskEmptyComponent,
    BackupTaskActionsComponent,
    TranslateModule,
  ],
})
export class WidgetBackupComponent implements OnInit {
  size = input.required<SlotSize>();

  readonly name = backupTasksWidget.name;

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
    private slideIn: SlideIn,
    private widgetResourcesService: WidgetResourcesService,
  ) {}

  ngOnInit(): void {
    this.getBackups();
  }

  getBackups(): void {
    this.isLoading = true;
    this.widgetResourcesService.getBackups()
      .pipe(untilDestroyed(this))
      .subscribe(([replicationTasks, rsyncTasks, cloudSyncTasks]) => {
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
    this.slideIn.open(
      CloudSyncWizardComponent,
      { wide: true },
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
    this.slideIn.open(ReplicationWizardComponent, { wide: true }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.getBackups());
  }

  addRsyncTask(): void {
    this.slideIn.open(RsyncTaskFormComponent, { wide: true })
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.getBackups());
  }

  private getTile(title: string, tasks: BackupRow[]): BackupTile {
    const successfulTasks = tasks.filter((backup) => this.successStates.includes(backup.state));
    const lastSuccessfulTask = successfulTasks
      .toSorted((a, b) => b.timestamp.$date - a.timestamp.$date)[0]?.timestamp;

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
