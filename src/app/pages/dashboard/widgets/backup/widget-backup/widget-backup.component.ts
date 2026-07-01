import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, TrackByFunction, Type, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent, TnIconComponent, TnTestIdDirective, TnTooltipDirective,
} from '@truenas/ui-components';
import { differenceInDays } from 'date-fns';
import { Direction } from 'app/enums/direction.enum';
import { DisplayableState, JobState } from 'app/enums/job-state.enum';
import { TaskState } from 'app/enums/task-state.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { BackupTile } from 'app/interfaces/cloud-backup.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  CloudBackup = 'TrueCloud Backup',
}

interface BackupRow {
  type: BackupType;
  timestamp: ApiTimestamp;
  state: DisplayableState;
  direction: Direction;
}

@Component({
  selector: 'ix-widget-backup',
  templateUrl: './widget-backup.component.html',
  styleUrls: [
    './widget-backup.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnIconComponent,
    TnTestIdDirective,
    TnTooltipDirective,
    RouterLink,
    BackupTaskTileComponent,
    BackupTaskEmptyComponent,
    BackupTaskActionsComponent,
    TranslateModule,
    NgTemplateOutlet,
  ],
})
export class WidgetBackupComponent implements OnInit {
  translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private slideIn = inject(SlideIn);
  private formPanel = inject(FormSidePanelService);
  private widgetResourcesService = inject(WidgetResourcesService);
  private destroyRef = inject(DestroyRef);

  size = input.required<SlotSize>();

  readonly name = backupTasksWidget.name;

  backups: BackupRow[] = [];
  isLoading = false;

  successStates: DisplayableState[] = [JobState.Success, TaskState.Finished];
  failedStates: DisplayableState[] = [JobState.Failed, TaskState.Error, JobState.Aborted];

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

  get cloudBackupTasks(): BackupRow[] {
    return this.backups.filter((backup) => backup.type === BackupType.CloudBackup);
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

    if (this.cloudBackupTasks.length) {
      tiles.push(this.getTile(this.translate.instant('TrueCloud Backup'), this.cloudBackupTasks));
    }
    return tiles;
  }

  get hasSendTasks(): boolean {
    return this.backups.some((backup) => this.isSendTask(backup));
  }

  ngOnInit(): void {
    this.getBackups();
  }

  getBackups(): void {
    this.isLoading = true;
    this.widgetResourcesService.backups$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([replicationTasks, rsyncTasks, cloudSyncTasks, cloudBackupTasks]) => {
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
            state: task.job?.state || (task.locked ? TaskState.Locked : TaskState.Pending),
            timestamp: task.job?.time_finished,
          })),
          ...cloudSyncTasks.map((task) => ({
            type: BackupType.CloudSync,
            direction: task.direction,
            state: task.job?.state || (task.locked ? TaskState.Locked : TaskState.Pending),
            timestamp: task.job?.time_finished,
          })),
          ...cloudBackupTasks.map((task) => ({
            type: BackupType.CloudBackup,
            direction: Direction.Push,
            state: task.job?.state || (task.locked ? TaskState.Locked : TaskState.Pending),
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
    ).onSuccess(() => this.getBackups(), this.destroyRef);
  }

  addReplicationTask(): void {
    this.slideIn.open(ReplicationWizardComponent, { wide: true })
      .onSuccess(() => this.getBackups(), this.destroyRef);
  }

  // RsyncTaskFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly rsyncTaskForm = RsyncTaskFormComponent as unknown as Type<SidePanelForm>;

  addRsyncTask(): void {
    this.formPanel.open(this.rsyncTaskForm, { title: this.translate.instant('Add Rsync Task'), wide: true })
      .onSuccess(() => this.getBackups(), this.destroyRef);
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
