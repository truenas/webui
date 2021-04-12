import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { T } from '../../../translate-marker';
import { IdmapService, ValidationService, SystemGeneralService, WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { IdmapFormComponent } from './idmap-form.component';
import helptext from '../../../helptext/directoryservice/idmap';
import { ModalService } from '../../../services/modal.service';
import { MatDialog } from '@angular/material/dialog';
import { ActiveDirectoryComponent } from '../activedirectory/activedirectory.component';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-idmap-list',
  template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class IdmapListComponent implements OnDestroy {
  public title = "Idmap";
  protected queryCall = 'idmap.query';
  protected wsDelete = "idmap.delete";
  protected entityList: any;
  protected idmapFormComponent: IdmapFormComponent;
  protected requiredDomains = [
    'DS_TYPE_ACTIVEDIRECTORY',
    'DS_TYPE_DEFAULT_DOMAIN',
    'DS_TYPE_LDAP'
  ];

  public columns: Array<any> = [
    { name: T('Name'), prop: 'name', always_display: true, minWidth: 250 },
    { name: T('Backend'), prop: 'idmap_backend', maxWidth: 100 },
    { name: T('DNS Domain Name'), prop: 'dns_domain_name' },
    { name: T('Range Low'), prop: 'range_low' },
    { name: T('Range High'), prop: 'range_high' },
    { name: T('Certificate'), prop: 'cert_name' },
  ];

  public rowIdentifier = 'name';
  public config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Idmap'),
      key_props: ['name']
    },
  };

  private refreshTableSubscription: Subscription;

  constructor(
    protected idmapService: IdmapService,
    protected validationService: ValidationService,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private dialog: DialogService,
    protected router: Router,
    public mdDialog: MatDialog,
    protected dialogService: DialogService
  ) { }

  resourceTransformIncomingRestData(data) {
    data.forEach((item) => {
      if (item.certificate) {
        item.cert_name = item.certificate.cert_name;
      }
      if (item.name === 'DS_TYPE_ACTIVEDIRECTORY' && item.idmap_backend === 'AUTORID') {
        let obj = data.find(o => o.name === 'DS_TYPE_DEFAULT_DOMAIN');
        obj.disableEdit = true;
      }
      const index = helptext.idmap.name.options.findIndex(o => o.value === item.name);
      if (index >= 0) item.name = helptext.idmap.name.options[index].label;
    })
    return data;
  }

  afterInit(entityList: any) {
    this.entityList = entityList;
    this.refreshTableSubscription = this.modalService.refreshTable$.subscribe(() => {
      this.entityList.getData();
    })
  }

  ngOnDestroy() {
    if (this.refreshTableSubscription) {
      this.refreshTableSubscription.unsubscribe();
    }
  }

  getAddActions() {
    return [{
      label: T('Add'),
      onClick: () => {
        this.idmapService.getADStatus().subscribe((res) => {
          if (res.enable) {
            this.doAdd();
          } else {
            this.dialogService.confirm(helptext.idmap.enable_ad_dialog.title, helptext.idmap.enable_ad_dialog.message,
              true, helptext.idmap.enable_ad_dialog.button).subscribe((res) => {
                if (res) {
                  this.showADForm();
                }
              })
          }
        })
      }
    }];
  }

  getActions(row) {
    const actions = [];
    actions.push({
      id: 'edit',
      label: T('Edit'),
      disabled: row.disableEdit,
      onClick: (row) => {
        this.doAdd(row.id);
      }
    });
    if (!this.requiredDomains.includes(row.name)) {
      actions.push({
        id: 'delete',
        label: T('Delete'),
        onClick: (row) => {
          this.entityList.doDeleteJob(row).subscribe(
            (progress) => {
            },
            (err) => {
              new EntityUtils().handleWSError(this.entityList, err);
            },
            () => {
              this.entityList.getData();
            }
          );
        }
      })
    }
    return actions;
  }

  doAdd(id?: number) {
    const idmapFormComponent = new IdmapFormComponent(
      this.idmapService,
      this.validationService,
      this.modalService,
      this.dialog,
      this.mdDialog,
    );

    this.modalService.open('slide-in-form', idmapFormComponent, id);
  }

  showADForm() {
    const formComponent = new ActiveDirectoryComponent(
      this.router,
      this.ws,
      this.modalService,
      this.sysGeneralService,
      this.dialog,
    );

    this.modalService.open('slide-in-form', formComponent);
  }

}
