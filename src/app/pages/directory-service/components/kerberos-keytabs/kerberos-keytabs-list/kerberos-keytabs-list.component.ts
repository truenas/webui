import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
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
    private slideInService: IxSlideInService,
    private translate: TranslateService,
  ) { }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      entityList.getData();
    });
  }

  doAdd(): void {
    this.slideInService.open(KerberosKeytabsFormComponent);
  }

  doEdit(id: number): void {
    const row = this.entityList.rows.find((row) => row.id === id);
    const form = this.slideInService.open(KerberosKeytabsFormComponent);
    form.setKerberosKeytabsForEdit(row);
  }

  getActions(): EntityTableAction<KerberosKeytab>[] {
    const actions = [];
    actions.push({
      id: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (row: KerberosKeytab) => {
        this.doEdit(row.id);
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
}
