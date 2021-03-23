import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { T } from '../../../translate-marker';
import { DialogService, StorageService, ValidationService } from 'app/services';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services/ws.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../services/modal.service';
import { DialogFormConfiguration } from '../../common/entity/entity-dialog/dialog-form-configuration.interface';
import * as _ from 'lodash';
import  helptext  from '../../../helptext/apps/apps';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { UserFormComponent } from '../../account/users/user-form/user-form.component';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { EmptyConfig, EmptyType } from '../../common/entity/entity-empty/entity-empty.component';

@Component({
  selector: 'app-manage-catalogs',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class ManageCatalogsComponent {

  public title = "Catalogs";
  protected route_add: string[] = ['account', 'users', 'add'];
  protected route_add_tooltip = "Add User";
  protected route_edit: string[] = ['account', 'users', 'edit'];

  protected entityList: any;
  protected loaderOpen = false;
  protected queryCall = 'catalog.query';
  protected wsDelete = 'catalog.delete';
  protected disableActionsConfig = true;

  protected addComponent: UserFormComponent;
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
  constructor(private router: Router,
              protected dialogService: DialogService, protected loader: AppLoaderService,
              protected ws: WebSocketService, protected prefService: PreferencesService,
              private translate: TranslateService, private modalService: ModalService,
              private storageService: StorageService,
              private validationService: ValidationService) {
  }

  ngOnInit() {
    this.refreshUserForm();
    this.modalService.refreshForm$.subscribe(() => {
      this.refreshUserForm();
    });
  }
  
  refreshUserForm() {

  }

  refresh() {
    this.entityList.getData();
    this.entityList.filter(this.filterString);
  }

  afterInit(entityList: any) { 
    this.entityList = entityList; 
    
    this.refreshTableSubscription = this.modalService.refreshTable$.subscribe(() => {
      this.refresh();
    })
  }

  getActions(row) {
    const actions = [];
    actions.push({
      id: row.id,
      icon: 'edit',
      label : helptext.manageCatalogs.menu.edit,
      name: 'edit',
      onClick : (row) => {
        this.edit(row);
      }
    }, {
      id: row.id,
      icon: 'refresh',
      label : helptext.manageCatalogs.menu.refresh,
      name: 'refresh',
      onClick : (row) => {
        this.refreshRow(row);
      }
    }, {
      id: row.id,
      icon: 'delete',
      label : helptext.manageCatalogs.menu.delete,
      name: 'delete',
      onClick : (row) => {
        this.entityList.doDelete(row);
      }
    }, {
      id: row.id,
      icon: 'summary',
      label : helptext.manageCatalogs.menu.summary,
      name: 'summary',
      onClick : (row) => {
        this.showSummary(row);
      }
    });

    return actions;
  }

  resourceTransformIncomingRestData(d) {
    let data = Object.assign([], d);
    return data;
  }


  doAdd() {
    this.modalService.open('slide-in-form', this.addComponent);
  }

  edit(row) {
    this.modalService.open('slide-in-form', this.addComponent, row.id)
  }

  refreshRow(row) {
    console.log("refreshRow", row);
  }

  showSummary(row) {
    console.log("show summary", row);
  }

  onToolbarAction(evt: CoreEvent) {
    if (evt.data.event_control == 'filter') {
      this.filterString = evt.data.filter;
      this.entityList.filter(this.filterString);
    }
  }
}