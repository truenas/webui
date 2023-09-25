import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit, QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, combineLatest, EMPTY, Observable, of,
} from 'rxjs';
import {
  catchError,
  filter, map, switchMap,
} from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import { trackById } from 'app/helpers/track-by.utils';
import { Job } from 'app/interfaces/job.interface';
import { IxDetailRowDirective } from 'app/modules/ix-tables/directives/ix-detail-row.directive';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { abortJobPressed } from 'app/modules/jobs/store/job.actions';
import {
  JobSlice, selectJobState, selectJobs, selectFailedJobs, selectRunningJobs,
} from 'app/modules/jobs/store/job.selectors';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
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
  @ViewChildren(IxDetailRowDirective) private detailRows: QueryList<IxDetailRowDirective>;

  dataSource = new MatTableDataSource<Job>([]);
  displayedColumns = ['name', 'state', 'id', 'time_started', 'time_finished', 'logs', 'actions'];
  expandedRow: Job;
  selectedIndex: JobTab = 0;

  selector$ = new BehaviorSubject<typeof selectRunningJobs | typeof selectJobs>(selectJobs);

  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.error$.pipe(map((error) => !!error)),
    this.selector$.pipe(
      switchMap((selector) => this.store$.select(selector)),
      map((jobs) => jobs.length === 0),
    ),
  ]).pipe(
    switchMap(([isLoading, isError, isNoData]) => {
      if (isLoading) {
        return of(EmptyType.Loading);
      }
      if (isError) {
        return of(EmptyType.Errors);
      }
      if (isNoData) {
        return of(EmptyType.NoPageData);
      }
      return of(EmptyType.NoSearchResults);
    }),
  );
  readonly JobState = JobState;
  readonly JobTab = JobTab;
  readonly trackByJobId = trackById;

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private ws: WebSocketService,
    private storage: StorageService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private store$: Store<JobSlice>,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private emptyService: EmptyService,
  ) {}

  onAborted(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Abort'),
        message: this.translate.instant('Are you sure you want to abort the <b>{task}</b> task?', { task: job.method }),
        hideCheckbox: true,
        buttonText: this.translate.instant('Abort'),
        cancelText: this.translate.instant('Cancel'),
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
        break;
      case JobTab.Running:
        this.selector$.next(selectRunningJobs);
        this.expandedRow = null;
        break;
      case JobTab.All:
      default:
        this.selector$.next(selectJobs);
        this.expandedRow = null;
        break;
    }
  }

  downloadLogs(job: Job): void {
    this.ws.call('core.download', ['filesystem.get', [job.logs_path], `${job.id}.log`]).pipe(
      switchMap(([_, url]) => this.storage.downloadUrl(url, `${job.id}.log`, 'text/plain')),
      catchError((error: HttpErrorResponse) => {
        this.dialogService.error(this.errorHandler.parseHttpError(error));
        return EMPTY;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }
}
