import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TrackByFunction } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { differenceInDays } from 'date-fns';
import { of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';

enum BackupType {
  CloudSync = 'Cloud Sync',
  Rsync = 'Rsync',
  Replication = 'Replication',
}

interface BackupRow {
  type: BackupType;
  description: string;
  timestamp: Date;
  state: JobState;
  isReceive: boolean;
}

interface BackupTile {
  title: string;
  totalSend: number;
  totalReceive: number;
  failedSend: number;
  failedReceive: number;
  lastWeekSend: number;
  lastWeekReceive: number;
  lastSuccessfulTask: Date;
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
  screenType = ScreenType.Desktop;
  backups: BackupRow[] = [];

  readonly ScreenType = ScreenType;

  trackByTile: TrackByFunction<BackupTile> = (_, tile) => tile.title;

  get allCount(): number {
    return this.backups.length;
  }

  get failedCount(): number {
    return this.backups.filter((backup) => backup.state === JobState.Failed).length;
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

  constructor(
    public mediaObserver: MediaObserver,
    public translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    super(translate);

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.getBackups();
  }

  getBackups(): void {
    const dateMock = new Date();
    dateMock.setTime(dateMock.getTime() - (18 * 3600 * 1000));

    const dataMock: BackupRow[] = [
      { type: BackupType.CloudSync, description: 'Description for task 1', timestamp: dateMock, state: JobState.Success, isReceive: false },
      { type: BackupType.CloudSync, description: 'Description for task 2', timestamp: dateMock, state: JobState.Success, isReceive: true },
      { type: BackupType.Rsync, description: 'Description for task 3', timestamp: dateMock, state: JobState.Failed, isReceive: false },
      { type: BackupType.Replication, description: 'Description for task 4', timestamp: dateMock, state: JobState.Success, isReceive: true },
      { type: BackupType.CloudSync, description: 'Description for task 5', timestamp: dateMock, state: JobState.Failed, isReceive: false },
      { type: BackupType.CloudSync, description: 'Description for task 6', timestamp: dateMock, state: JobState.Failed, isReceive: true },
      { type: BackupType.Rsync, description: 'Description for task 7', timestamp: dateMock, state: JobState.Success, isReceive: false },
    ];

    of(dataMock).pipe(untilDestroyed(this)).subscribe((backups) => {
      this.backups = backups;
      this.cdr.markForCheck();
    });
  }

  private getTile(title: string, tasks: BackupRow[]): BackupTile {
    const successfulTasks = tasks.filter((backup) => backup.state !== JobState.Failed);
    const lastSuccessfulTask =
      successfulTasks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp;

    return {
      title,
      totalSend: tasks.filter((backup) => !backup.isReceive).length,
      totalReceive: tasks.filter((backup) => backup.isReceive).length,
      failedSend: tasks.filter((backup) => backup.state === JobState.Failed && !backup.isReceive).length,
      failedReceive: tasks.filter((backup) => backup.state === JobState.Failed && backup.isReceive).length,
      lastWeekSend: successfulTasks.filter((backup) => !backup.isReceive && this.isThisWeek(backup.timestamp)).length,
      lastWeekReceive: successfulTasks.filter((backup) => backup.isReceive && this.isThisWeek(backup.timestamp)).length,
      lastSuccessfulTask,
    };
  }

  private isThisWeek(timestamp: Date): boolean {
    return differenceInDays(new Date(), timestamp) < 7;
  }
}
