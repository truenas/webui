import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS } from '@angular/material/slide-toggle';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, BehaviorSubject, combineLatest, of, Subject,
} from 'rxjs';
import {
  filter, map, tap, switchMap,
} from 'rxjs/operators';
import { BootEnvironmentAction } from 'app/enums/boot-environment-action.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { helptextSystemBootenv } from 'app/helptext/system/boot-env';
import { Bootenv } from 'app/interfaces/bootenv.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxCheckboxColumnComponent } from 'app/modules/ix-tables/components/ix-checkbox-column/ix-checkbox-column.component';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { BootPoolDeleteDialogComponent } from 'app/pages/system/bootenv/boot-pool-delete-dialog/boot-pool-delete-dialog.component';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { BootenvStatsDialogComponent } from 'app/pages/system/bootenv/bootenv-stats-dialog/bootenv-stats-dialog.component';
import { DialogService, WebSocketService, AppLoaderService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './bootenv-list.component.html',
  styleUrls: ['./bootenv-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_SLIDE_TOGGLE_DEFAULT_OPTIONS, useValue: { disableToggleValue: true } },
  ],
})
export class BootEnvironmentListComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  dataSource = new MatTableDataSource<Bootenv>([]);
  displayedColumns = ['select', 'name', 'active', 'created', 'rawspace', 'keep', 'actions'];
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(IxCheckboxColumnComponent, { static: false }) checkboxColumn: IxCheckboxColumnComponent<Bootenv>;
  defaultSort: Sort = { active: 'created', direction: 'desc' };

  isLoading$ = new BehaviorSubject(false);
  isError$ = new BehaviorSubject(false);
  fetchedData$ = new Subject<Bootenv[]>();
  emptyType$: Observable<EmptyType> = combineLatest([
    this.isLoading$,
    this.isError$,
    this.fetchedData$.pipe(map((bootenvs) => bootenvs.length === 0)),
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

  get selectionHasItems(): boolean {
    return this.checkboxColumn.selection.selected.some((bootenv) => ['', '-'].includes(bootenv.active));
  }

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    public formatter: IxFormatterService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private snackbar: SnackbarService,
    private emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    this.getBootEnvironments();
    this.slideInService.onClose$.pipe(
      filter((value) => value.response === true),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getBootEnvironments();
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onSearch(query: string): void {
    this.dataSource.filter = query;
  }

  openBootenvStats(): void {
    this.matDialog.open(BootenvStatsDialogComponent);
  }

  doAdd(): void {
    const modal = this.slideInService.open(BootEnvironmentFormComponent);
    modal.setupForm(BootEnvironmentAction.Create);
  }

  doRename(bootenv: Bootenv): void {
    const modal = this.slideInService.open(BootEnvironmentFormComponent);
    modal.setupForm(BootEnvironmentAction.Rename, bootenv.id);
  }

  doClone(bootenv: Bootenv): void {
    const modal = this.slideInService.open(BootEnvironmentFormComponent);
    modal.setupForm(BootEnvironmentAction.Clone, bootenv.id);
  }

  doScrub(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Scrub'),
      message: this.translate.instant('Start the scrub now?'),
      buttonText: this.translate.instant('Start Scrub'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('boot.scrub')),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
        this.snackbar.success(this.translate.instant('Scrub Started'));
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.loader.close();
      },
    });
  }

  doDelete(bootenvs: Bootenv[]): void {
    this.matDialog.open(BootPoolDeleteDialogComponent, {
      data: bootenvs.filter((bootenv) => bootenv.active === '-' || bootenv.active === ''),
    }).afterClosed().pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.getBootEnvironments();
      this.checkboxColumn.clearSelection();
      this.cdr.markForCheck();
    });
  }

  private createDataSource(bootenvs: Bootenv[] = []): void {
    this.dataSource = new MatTableDataSource(bootenvs);
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.name;
        case 'created':
          return item.created.$date;
        case 'rawspace':
          return item.rawspace;
        case 'keep':
          return item.keep.toString();
        case 'active':
          return item.active;
        default:
          return item.id;
      }
    };
    this.isLoading$.next(false);
    this.cdr.markForCheck();
  }

  private getBootEnvironments(): void {
    this.isLoading$.next(true);
    this.isError$.next(false);
    this.cdr.markForCheck();

    this.ws.call('bootenv.query').pipe(
      tap((bootenvs) => this.fetchedData$.next(bootenvs)),
      untilDestroyed(this),
    ).subscribe({
      next: (bootenvs) => {
        this.createDataSource(bootenvs);
      },
      error: () => {
        this.createDataSource();
        this.isLoading$.next(false);
        this.isError$.next(true);
        this.cdr.markForCheck();
      },
    });
  }

  doActivate(bootenv: Bootenv): void {
    this.dialogService.confirm({
      title: this.translate.instant('Activate'),
      message: this.translate.instant('Activate this Boot Environment?'),
      buttonText: helptextSystemBootenv.list_dialog_activate_action,
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('bootenv.activate', [bootenv.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.getBootEnvironments();
        this.loader.close();
        this.checkboxColumn.clearSelection();
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.loader.close();
      },
    });
  }

  toggleKeep(bootenv: Bootenv): void {
    if (!bootenv.keep) {
      this.dialogService.confirm({
        title: this.translate.instant('Keep'),
        message: this.translate.instant('Keep this Boot Environment?'),
        buttonText: this.translate.instant('Set Keep Flag'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.ws.call('bootenv.set_attribute', [bootenv.id, { keep: true }]).pipe(
          untilDestroyed(this),
        ).subscribe(
          {
            next: () => {
              this.getBootEnvironments();
              this.loader.close();
              this.checkboxColumn.clearSelection();
            },
            error: (error: WebsocketError) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              this.loader.close();
            },
          },
        );
      });
    } else {
      this.dialogService.confirm({
        title: this.translate.instant('Unkeep'),
        message: this.translate.instant('No longer keep this Boot Environment?'),
        buttonText: this.translate.instant('Remove Keep Flag'),
      }).pipe(
        filter(Boolean),
        tap(() => this.loader.open()),
        switchMap(() => this.ws.call('bootenv.set_attribute', [bootenv.id, { keep: false }])),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.getBootEnvironments();
          this.loader.close();
          this.checkboxColumn.selection.clear();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.loader.close();
        },
      });
    }
  }
}
