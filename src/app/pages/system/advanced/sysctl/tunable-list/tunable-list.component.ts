import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, filter, of, switchMap,
} from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './tunable-list.component.html',
  styleUrls: ['./tunable-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TunableListComponent implements OnInit {
  dataProvider = new ArrayDataProvider<Tunable>();
  filterString = '';
  tunables: Tunable[] = [];
  columns = createTable<Tunable>([
    textColumn({
      title: this.translate.instant('Variable'),
      propertyName: 'var',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Value'),
      propertyName: 'value',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      propertyName: 'id',
    }),
  ]);

  isLoading$ = new BehaviorSubject<boolean>(true);
  isNoData$ = new BehaviorSubject<boolean>(false);
  hasError$ = new BehaviorSubject<boolean>(false);
  emptyType$: Observable<EmptyType> = combineLatest([this.isLoading$, this.isNoData$, this.hasError$]).pipe(
    switchMap(([isLoading, isNoData, isError]) => {
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

  get emptyConfig(): EmptyService {
    return this.emptyConfigService;
  }

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private emptyConfigService: EmptyService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.getTunables();
  }

  getTunables(): void {
    this.isLoading$.next(true);
    this.hasError$.next(false);

    this.ws
      .call('tunable.query')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (tunables) => {
          this.tunables = tunables;
          this.isNoData$.next(!tunables.length);
          this.dataProvider.setRows(tunables);
          this.isLoading$.next(false);
          this.setDefaultSort();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading$.next(false);
          this.hasError$.next(true);
          this.cdr.markForCheck();
        },
      });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(TunableFormComponent);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getTunables();
    });
  }

  doEdit(tunable: Tunable): void {
    const slideInRef = this.slideInService.open(TunableFormComponent, { data: tunable });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getTunables();
    });
  }

  doDelete(tunable: Tunable): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Delete Sysctl'),
        message: this.translate.instant('Are you sure you want to delete "{name}"?', { name: tunable.var }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        const jobDialogRef = this.matDialog.open(EntityJobComponent, {
          data: {
            title: this.translate.instant('Deleting...'),
          },
        });
        jobDialogRef.componentInstance.setCall('tunable.delete', [tunable.id]);
        jobDialogRef.componentInstance.submit();
        jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
          this.getTunables();
          this.dialogService.closeAllDialogs();
          this.snackbar.success(this.translate.instant('Sysctl "{name}" deleted', { name: tunable.var }));
        });
        jobDialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
          this.dialogService.closeAllDialogs();
          this.dialogService.error(this.errorHandler.parseJobError(error));
        });
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.tunables.filter((tunable) => {
      return tunable.var.split('_').includes(this.filterString)
      || tunable.value.includes(this.filterString)
      || tunable.comment.includes(this.filterString);
    }));
    this.cdr.markForCheck();
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'var',
    });
  }
}
