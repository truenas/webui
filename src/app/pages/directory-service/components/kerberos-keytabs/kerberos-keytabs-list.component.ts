import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form.component';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-kerberos-keytabs-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class KerberosKeytabsListComponent implements EntityTableConfig {
  title = this.translate.instant('Kerberos Keytabs');
  queryCall = 'kerberos.keytab.query' as const;
  wsDelete = 'kerberos.keytab.delete' as const;
  protected entityList: EntityTableComponent;

  columns = [
    { name: this.translate.instant('Name'), prop: 'name', always_display: true },
  ];
  rowIdentifier = 'name';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant(helptext.kkt_list_delmsg_title),
      key_props: helptext.kkt_list_delmsgkey_props,
    },
  };

  constructor(
    private modalService: ModalService,
    private translate: TranslateService,
  ) { }

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

  getActions(): EntityTableAction<KerberosKeytab>[] {
    const actions = [];
    actions.push({
      id: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (row: KerberosKeytab) => {
        this.doAdd(row.id);
      },
    }, {
      id: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (row: KerberosKeytab) => {
        this.entityList.doDelete(row);
      },
    });

    return actions as EntityTableAction[];
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(KerberosKeytabsFormComponent, id);
  }
}
