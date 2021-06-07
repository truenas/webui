import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { PreferencesService } from 'app/core/services/preferences.service';
import helptext from 'app/helptext/apps/apps';
import { CoreEvent } from 'app/interfaces/events';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import {
  EntityTableComponent,
} from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { ModalService } from 'app/services/modal.service';
import { WebSocketService } from 'app/services/ws.service';
import { ManageCatalogSummaryDialog } from '../dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { CatalogAddFormComponent } from '../forms/catalog-add-form.component';
import { CatalogEditFormComponent } from '../forms/catalog-edit-form.component';

@UntilDestroy()
@Component({
  selector: 'app-manage-catalogs',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class ManageCatalogsComponent implements EntityTableConfig, OnInit {
  addComponent: CatalogAddFormComponent;
  editComponent: CatalogEditFormComponent;
  title = 'Catalogs';
  queryCall: 'catalog.query' = 'catalog.query';
  wsDelete: 'catalog.delete' = 'catalog.delete';
  queryCallOption = [[] as any, { extra: { item_details: true } }];
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
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Catalog',
      key_props: ['label'],
    },
  };

  filterString = '';

  private dialogRef: any;
  protected entityList: EntityTableComponent;
  protected loaderOpen = false;

  constructor(
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private prefService: PreferencesService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.refreshUserForm();

    this.modalService.refreshForm$.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshUserForm();
    });
  }

  refreshUserForm(): void {
    this.addComponent = new CatalogAddFormComponent(this.mdDialog, this.dialogService, this.modalService);
    this.editComponent = new CatalogEditFormComponent(this.mdDialog, this.dialogService, this.modalService);
  }

  refresh(): void {
    this.entityList.getData();
    this.entityList.filter(this.filterString);
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  getActions(row: any): EntityTableAction[] {
    return [
      {
        id: row.id,
        icon: 'edit',
        label: helptext.manageCatalogs.menu.edit,
        name: 'edit',
        onClick: (row: any) => {
          this.edit(row);
        },
      },
      {
        id: row.id,
        icon: 'refresh',
        label: helptext.manageCatalogs.menu.refresh,
        name: 'refresh',
        onClick: (row: any) => {
          this.refreshRow(row);
        },
      },
      {
        id: row.id,
        icon: 'delete',
        label: helptext.manageCatalogs.menu.delete,
        name: 'delete',
        disabled: row.builtin,
        onClick: (row: any) => {
          this.entityList.doDelete(row);
        },
      },
      {
        id: row.id,
        icon: 'summary',
        label: helptext.manageCatalogs.menu.summary,
        name: 'summary',
        onClick: (row: any) => {
          this.showSummary(row);
        },
      },
    ] as any[];
  }

  resourceTransformIncomingRestData(d: any): any {
    const data = Object.assign([], d);
    return data;
  }

  doAdd(): void {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  edit(row: any): void {
    this.modalService.open('slide-in-form', this.editComponent, row.label);
  }

  refreshRow(row: any): void {
    this.syncRow(row);
  }

  showSummary(row: any): void {
    this.mdDialog.open(ManageCatalogSummaryDialog, {
      width: '534px',
      data: row,
      disableClose: false,
    });
  }

  onToolbarAction(evt: CoreEvent): void {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.entityList.filter(this.filterString);
    } else if (evt.data.event_control == 'refresh_catalogs') {
      this.syncAll();
    } else if (evt.data.event_control == 'add_catalog') {
      this.doAdd();
    }
  }

  syncAll(): void {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, {
      data: {
        title: helptext.refreshing,
      },
      disableClose: true,
    });
    this.dialogRef.componentInstance.setCall('catalog.sync_all');
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }

  syncRow(row: any): void {
    const payload = [row.label];
    this.loader.open();
    this.ws.call('catalog.sync', payload).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.refresh();
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, res, this.dialogService);
      },
    );
  }

  onRowClick(row: any): void {
    this.showSummary(row);
  }
}
