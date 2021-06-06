import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/directoryservice/kerberoskeytabs-form-list';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { KerberosKeytabsFormComponent } from './kerberoskeytabs-form.component';

@UntilDestroy()
@Component({
  selector: 'app-kerberos-keytabs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosKeytabsListComponent implements EntityTableConfig {
  title = 'Kerberos Keytabs';
  queryCall: 'kerberos.keytab.query' = 'kerberos.keytab.query';
  wsDelete: 'kerberos.keytab.delete' = 'kerberos.keytab.delete';
  protected entityList: any;

  columns = [
    { name: 'Name', prop: 'name', always_display: true },
  ];
  rowIdentifier = 'name';
  config: any = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: helptext.kkt_list_delmsg_title,
      key_props: helptext.kkt_list_delmsgkey_props,
    },
  };

  constructor(private modalService: ModalService) { }

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
    const formComponent = new KerberosKeytabsFormComponent(this.modalService);
    this.modalService.open('slide-in-form', formComponent, id);
  }
}
