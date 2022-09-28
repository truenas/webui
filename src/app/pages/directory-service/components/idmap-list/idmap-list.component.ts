import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { DirectoryServiceState } from 'app/enums/directory-service-state.enum';
import { IdmapName } from 'app/enums/idmap.enum';
import helptext from 'app/helptext/directory-service/idmap';
import { Idmap } from 'app/interfaces/idmap.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ActiveDirectoryComponent } from 'app/pages/directory-service/components/active-directory/active-directory.component';
import { IdmapFormComponent } from 'app/pages/directory-service/components/idmap-form/idmap-form.component';
import { IdmapRow } from 'app/pages/directory-service/components/idmap-list/idmap-row.interface';
import { requiredIdmapDomains } from 'app/pages/directory-service/utils/required-idmap-domains.utils';
import {
  IdmapService, WebSocketService,
} from 'app/services';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class IdmapListComponent implements EntityTableConfig {
  title = this.translate.instant('Idmap');
  queryCall = 'idmap.query' as const;
  queryCallOption: QueryParams<Idmap>;
  wsDelete = 'idmap.delete' as const;
  protected entityList: EntityTableComponent;

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
    private slideIn: IxSlideInService,
    protected dialogService: DialogService,
    protected translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(ipdmaps: Idmap[]): IdmapRow[] {
    const transformed = [...ipdmaps] as IdmapRow[];
    transformed.forEach((row) => {
      if (row.certificate) {
        row.cert_name = row.certificate.cert_name;
      }
      if (row.name === IdmapName.DsTypeActiveDirectory && row.idmap_backend === 'AUTORID') {
        const obj = transformed.find((idmapRow) => idmapRow.name === IdmapName.DsTypeDefaultDomain);
        obj.disableEdit = true;
      }
      row.label = row.name;
      const index = helptext.idmap.name.options.findIndex((option) => option.value === row.name);
      if (index >= 0) {
        row.label = helptext.idmap.name.options[index].label;
      }
    });
    return transformed;
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideIn.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  prerequisite(): Promise<boolean> {
    return lastValueFrom(
      this.ws.call('directoryservices.get_state').pipe(
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
      ),
    );
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: this.translate.instant('Add'),
      onClick: () => {
        this.idmapService.getActiveDirectoryStatus().pipe(untilDestroyed(this)).subscribe((adConfig) => {
          if (adConfig.enable) {
            this.slideIn.open(IdmapFormComponent);
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
        const form = this.slideIn.open(IdmapFormComponent);
        form.setIdmapForEdit(row);
      },
    });
    if (!requiredIdmapDomains.includes(row.name as IdmapName)) {
      actions.push({
        id: 'delete',
        label: this.translate.instant('Delete'),
        name: 'delete',
        icon: 'delete',
        onClick: (row: IdmapRow) => {
          this.entityList.doDeleteJob(row).pipe(untilDestroyed(this)).subscribe({
            error: (err: WebsocketError) => {
              new EntityUtils().handleWsError(this.entityList, err);
            },
            complete: () => {
              this.entityList.getData();
            },
          });
        },
      });
    }
    return actions as EntityTableAction[];
  }

  showActiveDirectoryForm(): void {
    this.slideIn.open(ActiveDirectoryComponent, { wide: true });
  }
}
