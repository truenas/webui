import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit, QueryList,
  TemplateRef,
  TrackByFunction,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { MatSort } from '@angular/material/sort';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, EMPTY } from 'rxjs';
import {
  catchError,
  filter, map, switchMap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import {
  JobSlice, selectJobState, selectJobs, selectFailedJobs, selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { DialogService, StorageService, WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { JobTab } from './job-tab.enum';

@UntilDestroy()
@Component({
  templateUrl: './jobs-list.component.html',
  styleUrls: ['./jobs-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsListComponent implements OnInit, AfterViewInit {
  isLoading$ = this.store$.select(selectJobState).pipe(map((state) => state.isLoading));
  error$ = this.store$.select(selectJobState).pipe(map((state) => state.error));

  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;

  dataSource: MatTableDataSource<Job> = new MatTableDataSource([]);
  displayedColumns = ['name', 'state', 'id', 'time_started', 'time_finished', 'logs', 'actions'];
  expandedRow: Job;
  selectedIndex: JobTab = 0;
  emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No tasks'),
  };
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  selector$ = new BehaviorSubject<typeof selectRunningJobs | typeof selectJobs | typeof selectFailedJobs>(selectJobs);

  readonly JobState = JobState;
  readonly JobTab = JobTab;
  readonly trackByJobId: TrackByFunction<Job> = (_, job) => job.id;

  constructor(
    private ws: WebSocketService,
    private storage: StorageService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private store$: Store<JobSlice>,
    private cdr: ChangeDetectorRef,
    private layoutService: LayoutService,
  ) {}

  onAborted(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckBox: true,
        buttonMsg: this.translate.instant('Abort'),
        cancelMsg: this.translate.instant('Cancel'),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.store$.dispatch(abortJobPressed({ job }));
      });
  }

  ngOnInit(): void {
    this.selector$.pipe(
      switchMap((selector) => this.store$.select(selector)),
      untilDestroyed(this),
    ).subscribe((jobs) => {
      this.dataSource.data = jobs;
      this.dataSource.sort = this.sort;
      this.cdr.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onToggle(job: Job): void {
    this.expandedRow = this.expandedRow === job ? null : job;
    this.toggleDetailRows();
    this.cdr.markForCheck();
  }

  toggleDetailRows(): void {
    this.detailRows.forEach((row) => {
      if (row.expanded && row.ixDetailRow !== this.expandedRow) {
        row.close();
      } else if (!row.expanded && row.ixDetailRow === this.expandedRow) {
        row.open();
      }
    });
  }

  onTabChange(tab: JobTab): void {
    this.selectedIndex = tab;
    switch (this.selectedIndex) {
      case JobTab.Failed:
        this.selector$.next(selectFailedJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no failed tasks.');
        break;
      case JobTab.Running:
        this.selector$.next(selectRunningJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no active tasks.');
        break;
      case JobTab.All:
      default:
        this.selector$.next(selectJobs);
        this.expandedRow = null;
        this.emptyConfig.title = this.translate.instant('There are no tasks.');
        break;
    }
  }

  downloadLogs(job: Job): void {
    this.ws.call('core.download', ['filesystem.get', [job.logs_path], `${job.id}.log`]).pipe(
      switchMap(([_, url]) => this.storage.downloadUrl(url, `${job.id}.log`, 'text/plain')),
      catchError((error: HttpErrorResponse) => {
        this.dialogService.errorReport(error.name, error.message);
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }
}
