import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, combineLatest, of,
} from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { Catalog } from 'app/interfaces/catalog.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table2/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import {
  CatalogAddFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-add-form/catalog-add-form.component';
import { CatalogDeleteDialogComponent } from 'app/pages/apps/components/catalogs/catalog-delete-dialog/catalog-delete-dialog.component';
import {
  ManageCatalogSummaryDialogComponent,
} from 'app/pages/apps/components/catalogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { CatalogEditFormComponent } from './catalog-edit-form/catalog-edit-form.component';

@UntilDestroy()
@Component({
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogsComponent implements OnInit {
  filterString = '';
  catalogSyncJobIds = new Set<number>();
  dataProvider = new ArrayDataProvider<Catalog>();
  catalogs: Catalog[] = [];
  columns = createTable<Catalog>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'label',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Catalog URL'),
      propertyName: 'repository',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Branch'),
      propertyName: 'branch',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Preferred Trains'),
      propertyName: 'preferred_trains',
      sortable: true,
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

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.listenForCatalogSyncJobs();
    this.getCatalogs();
  }

  listenForCatalogSyncJobs(): void {
    this.ws.subscribe('core.get_jobs').pipe(
      filter((event) => event.fields.method === 'catalog.sync'),
      untilDestroyed(this),
    ).subscribe((event) => {
      const jobId = event.fields.id;
      if (!this.catalogSyncJobIds.has(jobId) && event.fields.state === JobState.Running) {
        this.refresh();
        this.catalogSyncJobIds.add(jobId);
      }

      if (event.fields.state === JobState.Success || event.fields.state === JobState.Failed) {
        this.catalogSyncJobIds.delete(jobId);
      }
    });
  }

  getCatalogs(): void {
    this.ws.call('catalog.query', [[], { extra: { item_details: true } }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (catalogs) => {
        this.catalogs = catalogs;
        this.dataProvider.setRows(catalogs);
        this.isLoading$.next(false);
        this.isNoData$.next(!catalogs.length);
        this.setDefaultSort();
        this.cdr.markForCheck();
      },
      error: () => {
        this.dataProvider.setRows([]);
        this.isLoading$.next(false);
        this.hasError$.next(true);
        this.cdr.markForCheck();
      },
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.catalogs.filter((catalog) => {
      return catalog.label.toLowerCase().includes(this.filterString)
        || catalog.id.toLowerCase().includes(this.filterString)
        || catalog.repository.toString().includes(this.filterString);
    }));
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'label',
    });
  }

  refresh(): void {
    this.getCatalogs();
  }

  doAdd(): void {
    this.dialogService.confirm({
      title: helptext.thirdPartyRepoWarning.title,
      message: helptext.thirdPartyRepoWarning.message,
      buttonText: helptext.thirdPartyRepoWarning.btnMsg,
      hideCheckbox: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const slideInRef = this.slideInService.open(CatalogAddFormComponent);
      slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.refresh());
    });
  }

  doEdit(catalog: Catalog): void {
    const slideInRef = this.slideInService.open(CatalogEditFormComponent);
    slideInRef.componentInstance.setCatalogForEdit(catalog);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.refresh());
  }

  doDelete(catalog: Catalog): void {
    this.matDialog.open(CatalogDeleteDialogComponent, {
      data: catalog,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.getCatalogs();
      });
  }

  refreshRow(row: Catalog): void {
    this.syncRow(row);
  }

  showSummary(row: Catalog): void {
    this.matDialog.open(ManageCatalogSummaryDialogComponent, {
      width: '534px',
      data: row,
    });
  }

  onRefreshAll(): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    dialogRef.componentInstance.setCall('catalog.sync_all');
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }

  syncRow(row: Catalog): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    dialogRef.componentInstance.setCall('catalog.sync', [row.label]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }
}
