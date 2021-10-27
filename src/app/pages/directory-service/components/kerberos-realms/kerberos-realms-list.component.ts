import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/directory-service/kerberos-realms-form-list';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-form.component';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-user-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosRealmsListComponent implements EntityTableConfig {
  title = this.translate.instant('Kerberos Realms');
  queryCall = 'kerberos.realm.query' as const;
  wsDelete = 'kerberos.realm.delete' as const;
  keyList = ['admin_server', 'kdc', 'kpasswd_server'];
  protected entityList: EntityTableComponent;

  columns = [
    { name: this.translate.instant('Realm'), prop: 'realm', always_display: true },
    { name: this.translate.instant('KDC'), prop: 'kdc' },
    { name: this.translate.instant('Admin Server'), prop: 'admin_server' },
    { name: this.translate.instant('Password Server'), prop: 'kpasswd_server' },
  ];
  rowIdentifier = 'realm';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant(helptext.krb_realmlist_deletemessage_title),
      key_props: helptext.krb_realmlist_deletemessage_key_props,
    },
  };

  constructor(
    private modalService: ModalService,
    private translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(data: any[]): any[] {
    data.forEach((row) => {
      this.keyList.forEach((key) => {
        if (row.hasOwnProperty(key)) {
          row[key] = (row[key].join(' '));
        }
      });
    });
    return data;
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.modalService.refreshTable$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: this.translate.instant('Add'),
      onClick: () => {
        this.doAdd();
      },
    }] as EntityTableAction[];
  }

  getActions(row: any): EntityTableAction[] {
    const actions = [];
    actions.push({
      id: 'edit',
      label: this.translate.instant('Edit'),
      disabled: row.disableEdit,
      onClick: (row: any) => {
        this.doAdd(row.id);
      },
    }, {
      id: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (row: any) => {
        this.entityList.doDelete(row);
      },
    });

    return actions as EntityTableAction[];
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(KerberosRealmsFormComponent, id);
  }
}
