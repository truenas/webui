import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, tap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap-name.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { Idmap } from 'app/interfaces/idmap.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapRow } from 'app/pages/directory-service/components/idmap/idmap-row.interface';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  IdmapService, WebSocketService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { ModalService } from 'app/services/modal.service';
import { IdmapFormComponent } from './idmap-form.component';

@UntilDestroy()
@Component({
  selector: 'app-idmap-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class IdmapListComponent implements EntityTableConfig {
  title = this.translate.instant('Idmap');
  queryCall = 'idmap.query' as const;
  queryCallOption: QueryParams<Idmap>;
  wsDelete = 'idmap.delete' as const;
  protected entityList: EntityTableComponent;
  protected idmapFormComponent: IdmapFormComponent;

  columns = [
    {
      name: this.translate.instant('Name'), prop: 'label', always_display: true, minWidth: 250,
    },
    { name: this.translate.instant('Backend'), prop: 'idmap_backend', maxWidth: 100 },
    { name: this.translate.instant('DNS Domain Name'), prop: 'dns_domain_name' },
    { name: this.translate.instant('Range Low'), prop: 'range_low' },
    { name: this.translate.instant('Range High'), prop: 'range_high' },
    { name: this.translate.instant('Certificate'), prop: 'cert_name' },
  ];

  rowIdentifier = 'name';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Idmap'),
      key_props: ['name'],
    },
  };

  constructor(
    protected idmapService: IdmapService,
    private ws: WebSocketService,
    private modalService: ModalService,
    public mdDialog: MatDialog,
    protected dialogService: DialogService,
    protected translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(data: Idmap[]): IdmapRow[] {
    const transformed = [...data] as IdmapRow[];
    transformed.forEach((item) => {
      if (item.certificate) {
        item.cert_name = item.certificate.cert_name;
      }
      if (item.name === IdmapName.DsTypeActiveDirectory && item.idmap_backend === 'AUTORID') {
        const obj = transformed.find((o) => o.name === IdmapName.DsTypeDefaultDomain);
        obj.disableEdit = true;
      }
      item.label = item.name;
      const index = helptext.idmap.name.options.findIndex((o) => o.value === item.name);
      if (index >= 0) {
        item.label = helptext.idmap.name.options[index].label;
      }
    });
    return transformed;
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
      label: this.translate.instant('Add'),
      onClick: () => {
        this.idmapService.getActiveDirectoryStatus().pipe(untilDestroyed(this)).subscribe((adConfig) => {
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
              .subscribe(() => this.showActiveDirectoryForm());
          }
        });
      },
    }] as EntityTableAction[];
  }

  getActions(row: IdmapRow): EntityTableAction<IdmapRow>[] {
    const actions = [];
    actions.push({
      id: 'edit',
      name: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      disabled: row.disableEdit,
      onClick: (row: IdmapRow) => {
        this.doAdd(row.id);
      },
    });
    if (!requiredIdmapDomains.includes(row.name)) {
      actions.push({
        id: 'delete',
        label: this.translate.instant('Delete'),
        name: 'delete',
        icon: 'delete',
        onClick: (row: IdmapRow) => {
          this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe(
            () => {},
            (err: WebsocketError) => {
              new EntityUtils().handleWsError(this.entityList, err);
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
    this.modalService.openInSlideIn(IdmapFormComponent, id);
  }

  showActiveDirectoryForm(): void {
    this.modalService.openInSlideIn(ActiveDirectoryComponent);
  }
}
