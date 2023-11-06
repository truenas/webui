import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable, of, tap } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { relativeDateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { stateButtonColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-state-button/ix-cell-state-button.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
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

  dataProvider: AsyncDataProvider<BackupRow>;
  columns = createTable<BackupRow>([
    textColumn({
      propertyName: 'type',
    }),
    textColumn({
      propertyName: 'description',
    }),
    relativeDateColumn({
      propertyName: 'timestamp',
    }),
    stateButtonColumn({
      propertyName: 'state',
    }),
  ]);

  readonly ScreenType = ScreenType;
  readonly BackupType = BackupType;

  get allCount(): number {
    return this.backups.length;
  }

  get failedCount(): number {
    return this.backups.filter((backup) => backup.state === JobState.Failed).length;
  }

  get replicationCount(): number {
    return this.backups.filter((backup) => backup.type === BackupType.Replication).length;
  }

  get cloudSyncCount(): number {
    return this.backups.filter((backup) => backup.type === BackupType.CloudSync).length;
  }

  get rsyncCount(): number {
    return this.backups.filter((backup) => backup.type === BackupType.Rsync).length;
  }

  get emptyConfig$(): Observable<EmptyConfig> {
    return this.dataProvider.emptyType$.pipe(
      map((emptyType) => emptyType === EmptyType.NoPageData
        ? { title: this.translate.instant('No backup tasks found'), type: EmptyType.NoPageData, large: true }
        : this.emptyService.defaultEmptyConfig(emptyType),
      ),
    );
  }

  constructor(
    public mediaObserver: MediaObserver,
    public translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private emptyService: EmptyService,
  ) {
    super(translate);

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    const dateMock = new Date();
    dateMock.setTime(dateMock.getTime() - (18 * 3600 * 1000));

    const dataMock: BackupRow[] = [
      { type: BackupType.CloudSync, description: 'Description for task 1', timestamp: dateMock, state: JobState.Success },
      { type: BackupType.CloudSync, description: 'Description for task 2', timestamp: dateMock, state: JobState.Success },
      { type: BackupType.Rsync, description: 'Description for task 3', timestamp: dateMock, state: JobState.Failed },
      { type: BackupType.Replication, description: 'Description for task 4', timestamp: dateMock, state: JobState.Success },
      { type: BackupType.CloudSync, description: 'Description for task 5', timestamp: dateMock, state: JobState.Failed },
      { type: BackupType.CloudSync, description: 'Description for task 6', timestamp: dateMock, state: JobState.Failed },
      { type: BackupType.Rsync, description: 'Description for task 7', timestamp: dateMock, state: JobState.Success },
    ];

    const backups$ = of(dataMock).pipe(
      tap((backups) => this.backups = backups),
      map((backups) => backups.slice(0, 5)),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<BackupRow>(backups$);
    this.getBackups();
  }

  getBackups(): void {
    this.dataProvider.load();
  }
}
