import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/directoryservice/kerberosrealms-form-list';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { KerberosRealmsFormComponent } from './kerberosrealms-form.component';

@UntilDestroy()
@Component({
  selector: 'app-user-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosRealmsListComponent implements EntityTableConfig {
  title = 'Kerberos Realms';
  queryCall: 'kerberos.realm.query' = 'kerberos.realm.query';
  wsDelete: 'kerberos.realm.delete' = 'kerberos.realm.delete';
  keyList = ['admin_server', 'kdc', 'kpasswd_server'];
  protected entityList: any;

  columns = [
    { name: T('Realm'), prop: 'realm', always_display: true },
    { name: T('KDC'), prop: 'kdc' },
    { name: T('Admin Server'), prop: 'admin_server' },
    { name: T('Password Server'), prop: 'kpasswd_server' },
  ];
  rowIdentifier = 'realm';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.krb_realmlist_deletemessage_title,
      key_props: helptext.krb_realmlist_deletemessage_key_props,
    },
  };

  constructor(private modalService: ModalService) { }

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
        this.doAdd();
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
    }, {
      id: 'delete',
      label: T('Delete'),
      onClick: (row: any) => {
        this.entityList.doDelete(row);
      },
    });

    return actions as EntityTableAction[];
  }

  doAdd(id?: number): void {
    const formComponent = new KerberosRealmsFormComponent(this.modalService);
    this.modalService.open('slide-in-form', formComponent, id);
  }
}
