import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogService, StorageService, ValidationService } from 'app/services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services/ws.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../services/modal.service';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';
import  helptext  from '../../../helptext/apps/apps';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { ManageCatalogSummaryDialog } from '../dialogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import {CatalogAddFormComponent} from '../forms/catalog-add-form.component';
import {CatalogEditFormComponent} from '../forms/catalog-edit-form.component';
import { EntityUtils } from '../../common/entity/utils';

@Component({
  selector: 'app-manage-catalogs',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class ManageCatalogsComponent implements OnDestroy {

  public title = "Catalogs";
  protected entityList: any;
  protected loaderOpen = false;
  protected queryCall = 'catalog.query';
  protected wsDelete = 'catalog.delete';
  protected queryCallOption = [[] as any, {"extra": {"item_details": true}}];
  protected disableActionsConfig = true;
  private dialogRef: any;
  protected addComponent: CatalogAddFormComponent;
  protected editComponent: CatalogEditFormComponent;
  private refreshTableSubscription: any;

  public columns: Array < any > = [
    { name: 'Name', prop: 'label', always_display: true, minWidth: 150},
    { name: 'Catalog URL', prop: 'repository', always_display: true, maxWidth: 100 },
    { name: 'Branch', prop: 'branch', always_display: true, maxWidth: 100 },
    { name: 'Prefered Trains', prop: 'preferred_trains', always_display: true, maxWidth: 200  },
  ];

  public rowIdentifier = 'id';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Catalog',
      key_props: ['label']
    }
  };

  public filterString: string = '';
  constructor(private mdDialog: MatDialog,
              protected dialogService: DialogService, protected loader: AppLoaderService,
              protected ws: WebSocketService, protected prefService: PreferencesService,
              private modalService: ModalService) {
  }

  ngOnInit() {
    this.refreshUserForm();

    this.modalService.refreshForm$.subscribe(() => {
      this.refreshUserForm();
    });
  }

  ngOnDestroy(){
    if(this.refreshTableSubscription){
      this.refreshTableSubscription.unsubscribe();
    }
  }

  refreshUserForm() {
    this.addComponent = new CatalogAddFormComponent(this.mdDialog,this.dialogService, this.modalService);
    this.editComponent = new CatalogEditFormComponent(this.mdDialog,this.dialogService, this.modalService);
  }

  refresh() {
    this.entityList.getData();
    this.entityList.filter(this.filterString);
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
  }

  getActions(row: any) {
    const actions = [];
    actions.push({
      id: row.id,
      icon: 'edit',
      label : helptext.manageCatalogs.menu.edit,
      name: 'edit',
      onClick : (row: any) => {
        this.edit(row);
      }
    }, {
      id: row.id,
      icon: 'refresh',
      label : helptext.manageCatalogs.menu.refresh,
      name: 'refresh',
      onClick : (row: any) => {
        this.refreshRow(row);
      }
    }, {
      id: row.id,
      icon: 'delete',
      label : helptext.manageCatalogs.menu.delete,
      name: 'delete',
      disabled: row.builtin,
      onClick : (row: any) => {
        this.entityList.doDelete(row);
      }
    }, {
      id: row.id,
      icon: 'summary',
      label : helptext.manageCatalogs.menu.summary,
      name: 'summary',
      onClick : (row: any) => {
        this.showSummary(row);
      }
    });

    return actions;
  }

  resourceTransformIncomingRestData(d: any) {
    let data = Object.assign([], d);
    return data;
  }


  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  edit(row: any) {
    this.modalService.open('slide-in-form', this.editComponent, row.label)
  }

  refreshRow(row: any) {
    this.syncRow(row);
  }

  showSummary(row: any) {
    this.mdDialog.open(ManageCatalogSummaryDialog, {
      width: '534px',
      data: row,
      disableClose: false,
    });
  }

  onToolbarAction(evt: CoreEvent) {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.entityList.filter(this.filterString);
    } else if (evt.data.event_control == 'refresh_catalogs') {
      this.syncAll();
    } else if (evt.data.event_control == 'add_catalog') {
      this.doAdd();
    }
  }

  syncAll() {
    this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { 'title': (
      helptext.refreshing) }, disableClose: true});
    this.dialogRef.componentInstance.setCall("catalog.sync_all");
    this.dialogRef.componentInstance.submit();
    this.dialogRef.componentInstance.success.subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.refresh();
    });
  }

  syncRow(row: any) {
    const payload = [row.label];
    this.loader.open();
    this.ws.call("catalog.sync", payload).subscribe(
      (res) => {
        this.loader.close();
        this.refresh();
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleWSError(this, res, this.dialogService);
      }
    );
  }

  onRowClick(row: any) {
    this.showSummary(row);
  }
}
