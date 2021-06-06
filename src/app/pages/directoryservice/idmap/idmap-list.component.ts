import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/directoryservice/idmap';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  IdmapService, ValidationService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { ActiveDirectoryComponent } from '../activedirectory/activedirectory.component';
import { IdmapFormComponent } from './idmap-form.component';

@UntilDestroy()
@Component({
  selector: 'app-idmap-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class IdmapListComponent implements EntityTableConfig {
  title = 'Idmap';
  queryCall: 'idmap.query' = 'idmap.query';
  wsDelete: 'idmap.delete' = 'idmap.delete';
  protected entityList: any;
  protected idmapFormComponent: IdmapFormComponent;
  protected requiredDomains = [
    'DS_TYPE_ACTIVEDIRECTORY',
    'DS_TYPE_DEFAULT_DOMAIN',
    'DS_TYPE_LDAP',
  ];

  columns = [
    {
      name: T('Name'), prop: 'name', always_display: true, minWidth: 250,
    },
    { name: T('Backend'), prop: 'idmap_backend', maxWidth: 100 },
    { name: T('DNS Domain Name'), prop: 'dns_domain_name' },
    { name: T('Range Low'), prop: 'range_low' },
    { name: T('Range High'), prop: 'range_high' },
    { name: T('Certificate'), prop: 'cert_name' },
  ];

  rowIdentifier = 'name';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Idmap'),
      key_props: ['name'],
    },
  };

  constructor(
    protected idmapService: IdmapService,
    protected validationService: ValidationService,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modalService: ModalService,
    private dialog: DialogService,
    protected router: Router,
    public mdDialog: MatDialog,
    protected dialogService: DialogService,
  ) { }

  resourceTransformIncomingRestData(data: any[]): any[] {
    data.forEach((item) => {
      if (item.certificate) {
        item.cert_name = item.certificate.cert_name;
      }
      if (item.name === 'DS_TYPE_ACTIVEDIRECTORY' && item.idmap_backend === 'AUTORID') {
        const obj = data.find((o) => o.name === 'DS_TYPE_DEFAULT_DOMAIN');
        obj.disableEdit = true;
      }
      const index = helptext.idmap.name.options.findIndex((o) => o.value === item.name);
      if (index >= 0) item.name = helptext.idmap.name.options[index].label;
    });
    return data;
  }

  afterInit(entityList: any): void {
    this.entityList = entityList;
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: T('Add'),
      onClick: () => {
        this.idmapService.getADStatus().pipe(untilDestroyed(this)).subscribe((res) => {
          if (res.enable) {
            this.doAdd();
          } else {
            this.dialogService.confirm(helptext.idmap.enable_ad_dialog.title, helptext.idmap.enable_ad_dialog.message,
              true, helptext.idmap.enable_ad_dialog.button).pipe(untilDestroyed(this)).subscribe((res: boolean) => {
              if (res) {
                this.showADForm();
              }
            });
          }
        });
      },
    }] as EntityTableAction[];
  }

  getActions(row: any): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: 'edit',
      label: T('Edit'),
      disabled: row.disableEdit,
      onClick: (row: any) => {
        this.doAdd(row.id);
      },
    });
    if (!this.requiredDomains.includes(row.name)) {
      actions.push({
        id: 'delete',
        label: T('Delete'),
        onClick: (row: any) => {
          this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe(
            () => {},
            (err: any) => {
              new EntityUtils().handleWSError(this.entityList, err);
            },
            () => {
              this.entityList.getData();
            },
          );
        },
      });
    }
    return actions as EntityTableAction[];
  }

  doAdd(id?: number): void {
    const idmapFormComponent = new IdmapFormComponent(
      this.idmapService,
      this.validationService,
      this.modalService,
      this.dialog,
      this.mdDialog,
    );

    this.modalService.open('slide-in-form', idmapFormComponent, id);
  }

  showADForm(): void {
    const formComponent = new ActiveDirectoryComponent(
      this.router,
      this.ws,
      this.modalService,
      this.mdDialog,
      this.sysGeneralService,
      this.dialog,
    );

    this.modalService.open('slide-in-form', formComponent);
  }
}
