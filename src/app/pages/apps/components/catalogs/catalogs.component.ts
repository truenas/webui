import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, tap } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextApps } from 'app/helptext/apps/apps';
import { Catalog } from 'app/interfaces/catalog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
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
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
  protected readonly requiredRoles = [Role.CatalogWrite];

  catalogSyncJobIds = new Set<number>();
  dataProvider: AsyncDataProvider<Catalog>;
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
  ], {
    rowTestId: (row) => 'catalog-' + row.label,
  });

  constructor(
    private matDialog: MatDialog,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    protected emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnInit(): void {
    const catalogs$ = this.ws.call('catalog.query', [[], { extra: { item_details: true } }]).pipe(
      tap((catalogs) => this.catalogs = catalogs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<Catalog>(catalogs$);
    this.setDefaultSort();
    this.refresh();

    this.listenForCatalogSyncJobs();
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

  onListFiltered(query: string): void {
    const filterString = query.toLowerCase();
    this.dataProvider.setRows(this.catalogs.filter((catalog) => {
      return catalog.label.toLowerCase().includes(filterString)
        || catalog.id.toLowerCase().includes(filterString)
        || catalog.repository.toString().includes(filterString);
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
    this.dataProvider.load();
  }

  doAdd(): void {
    this.dialogService.confirm({
      title: helptextApps.thirdPartyRepoWarning.title,
      message: helptextApps.thirdPartyRepoWarning.message,
      buttonText: helptextApps.thirdPartyRepoWarning.btnMsg,
      hideCheckbox: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      const slideInRef = this.slideInService.open(CatalogAddFormComponent);
      slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.refresh());
    });
  }

  doEdit(catalog: Catalog): void {
    const slideInRef = this.slideInService.open(CatalogEditFormComponent);
    slideInRef.componentInstance.setCatalogForEdit(catalog);
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.refresh());
  }

  doDelete(catalog: Catalog): void {
    this.matDialog.open(CatalogDeleteDialogComponent, {
      data: catalog,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
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
    this.dialogService.jobDialog(
      this.ws.job('catalog.sync_all'),
      {
        title: this.translate.instant(helptextApps.refreshing),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  syncRow(catalog: Catalog): void {
    this.dialogService.jobDialog(
      this.ws.job('catalog.sync', [catalog.label]),
      {
        title: this.translate.instant(helptextApps.refreshing),
        canMinimize: true,
      },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }
}
