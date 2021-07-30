import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter, map, tap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap-name.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { Idmap } from 'app/interfaces/idmap.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  IdmapService, SystemGeneralService, ValidationService, WebSocketService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { IdmapFormComponent } from './idmap-form.component';

@UntilDestroy()
@Component({
  selector: 'app-idmap-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class IdmapListComponent implements EntityTableConfig {
  title = 'Idmap';
  queryCall: 'idmap.query' = 'idmap.query';
  queryCallOption: QueryParams<Idmap>;
  wsDelete: 'idmap.delete' = 'idmap.delete';
  protected entityList: EntityTableComponent;
  protected idmapFormComponent: IdmapFormComponent;

  columns = [
    {
      name: T('Name'), prop: 'label', always_display: true, minWidth: 250,
    },
    { name: T('Backend'), prop: 'idmap_backend', maxWidth: 100 },
    { name: T('DNS Domain Name'), prop: 'dns_domain_name' },
    { name: T('Range Low'), prop: 'range_low' },
    { name: T('Range High'), prop: 'range_high' },
    { name: T('Certificate'), prop: 'cert_name' },
  ];

  rowIdentifier = 'name';
  config = {
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
      if (item.name === IdmapName.DsTypeActiveDirectory && item.idmap_backend === 'AUTORID') {
        const obj = data.find((o) => o.name === IdmapName.DsTypeDefaultDomain);
        obj.disableEdit = true;
      }
      item.label = item.name;
      const index = helptext.idmap.name.options.findIndex((o) => o.value === item.name);
      if (index >= 0) {
        item.label = helptext.idmap.name.options[index].label;
      }
    });
    return data;
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  prerequisite(): Promise<boolean> {
    return this.ws.call('directoryservices.get_state').pipe(
      tap((state) => {
        if (state.ldap !== DirectoryServiceState.Disabled) {
          this.queryCallOption = [[['name', '=', IdmapName.DsTypeLdap]]];
        } else if (state.activedirectory !== DirectoryServiceState.Disabled) {
          this.queryCallOption = [[['name', '!=', IdmapName.DsTypeLdap]]];
        } else {
          this.queryCallOption = undefined;
        }
      }),
      map(() => true),
    ).toPromise();
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: T('Add'),
      onClick: () => {
        this.idmapService.getADStatus().pipe(untilDestroyed(this)).subscribe((adConfig) => {
          if (adConfig.enable) {
            this.doAdd();
          } else {
            this.dialogService.confirm({
              title: helptext.idmap.enable_ad_dialog.title,
              message: helptext.idmap.enable_ad_dialog.message,
              hideCheckBox: true,
              buttonMsg: helptext.idmap.enable_ad_dialog.button,
            })
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.showADForm());
          }
        });
      },
    }] as EntityTableAction[];
  }

  getActions(row: any): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: 'edit',
      name: 'edit',
      icon: 'edit',
      label: T('Edit'),
      disabled: row.disableEdit,
      onClick: (row: any) => {
        this.doAdd(row.id);
      },
    });
    if (!requiredIdmapDomains.includes(row.name)) {
      actions.push({
        id: 'delete',
        label: T('Delete'),
        name: 'delete',
        icon: 'delete',
        onClick: (row: any) => {
          this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe(
            () => {},
            (err: WebsocketError) => {
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
