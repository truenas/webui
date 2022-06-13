import {
  AfterViewInit, Component, OnDestroy, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/apps/apps';
import { Catalog, CatalogQueryParams } from 'app/interfaces/catalog.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import {
  EntityTableComponent,
} from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { ManageCatalogSummaryDialogComponent } from 'app/pages/applications/dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { CatalogAddFormComponent } from 'app/pages/applications/forms/catalog-add-form/catalog-add-form.component';
import { CatalogEditFormComponent } from 'app/pages/applications/forms/catalog-edit-form/catalog-edit-form.component';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-manage-catalogs',
  templateUrl: './manage-catalogs.component.html',
})
export class ManageCatalogsComponent implements EntityTableConfig<Catalog>, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  title = 'Catalogs';
  queryCall = 'catalog.query' as const;
  wsDelete = 'catalog.delete' as const;
  queryCallOption: CatalogQueryParams = [[], { extra: { item_details: true } }];
  jobsSubscription: Subscription;
  disableActionsConfig = true;

  columns = [
    {
      name: 'Name', prop: 'label', always_display: true, minWidth: 150,
    },
    {
      name: 'Catalog URL', prop: 'repository', always_display: true, maxWidth: 100,
    },
    {
      name: 'Branch', prop: 'branch', always_display: true, maxWidth: 100,
    },
    {
      name: 'Preferred Trains', prop: 'preferred_trains', always_display: true, maxWidth: 200,
    },
  ];

  rowIdentifier = 'id';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Catalog',
      key_props: ['label'],
    },
  };

  filterString = '';
  catalogSyncJobIds: number[] = [];

  private dialogRef: MatDialogRef<EntityJobComponent>;
  protected entityList: EntityTableComponent;

  constructor(
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.jobsSubscription = this.ws.subscribe('core.get_jobs').pipe(
      filter((event) => event.fields.method === 'catalog.sync'),
      untilDestroyed(this),
    ).subscribe((event) => {
      const jobId = event.fields.id;
      if (!this.catalogSyncJobIds.includes(jobId) && event.fields.state === JobState.Running) {
        this.refresh();
        this.catalogSyncJobIds.push(jobId);
      }

      if (event.fields.state === JobState.Success || event.fields.state === JobState.Failed) {
        this.catalogSyncJobIds.splice(this.catalogSyncJobIds.indexOf(jobId));
      }
    });

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refresh();
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    if (this.jobsSubscription) {
      this.ws.unsubscribe(this.jobsSubscription);
    }
  }

  refresh(): void {
    this.entityList.getData();
    if (this.filterString) {
      this.entityList.filter(this.filterString);
    }
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  getActions(row: Catalog): EntityTableAction[] {
    return [
      {
        id: row.id,
        icon: 'edit',
        label: helptext.manageCatalogs.menu.edit,
        name: 'edit',
        onClick: (row: Catalog) => {
          this.edit(row);
        },
      },
      {
        id: row.id,
        icon: 'refresh',
        label: helptext.manageCatalogs.menu.refresh,
        name: 'refresh',
        onClick: (row: Catalog) => {
          this.refreshRow(row);
        },
      },
      {
        id: row.id,
        icon: 'delete',
        label: helptext.manageCatalogs.menu.delete,
        name: 'delete',
        disabled: row.builtin,
        onClick: (row: Catalog) => {
          this.entityList.doDelete(row);
        },
      },
      {
        id: row.id,
        icon: 'summary',
        label: helptext.manageCatalogs.menu.summary,
        name: 'summary',
        onClick: (row: Catalog) => {
          this.showSummary(row);
        },
      },
    ];
  }

  doAdd(): void {
    this.dialogService.confirm({
      title: helptext.thirdPartyRepoWarning.title,
      message: helptext.thirdPartyRepoWarning.message,
      buttonMsg: helptext.thirdPartyRepoWarning.btnMsg,
      hideCheckBox: true,
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(
      () => this.slideInService.open(CatalogAddFormComponent),
    );
  }

  edit(catalog: Catalog): void {
    const modal = this.slideInService.open(CatalogEditFormComponent);
    modal.setCatalogForEdit(catalog);
  }

  refreshRow(row: Catalog): void {
    this.syncRow(row);
  }

  showSummary(row: Catalog): void {
    this.mdDialog.open(ManageCatalogSummaryDialogComponent, {
      width: '534px',
      data: row,
    });
  }

  onSearch(query: string): void {
    this.filterString = query;
    this.entityList.filter(this.filterString);
  }

  onRefreshAll(): void {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    this.dialogRef.componentInstance.setCall('catalog.sync_all');
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }

  syncRow(row: Catalog): void {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
    });
    this.dialogRef.componentInstance.setCall('catalog.sync', [row.label]);
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }

  onRowClick(row: Catalog): void {
    this.showSummary(row);
  }
}
