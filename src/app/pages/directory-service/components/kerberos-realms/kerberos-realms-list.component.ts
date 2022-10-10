import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/directory-service/kerberos-realms-form-list';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';
import { KerberosRealmRow } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realm-row.interface';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class KerberosRealmsListComponent implements EntityTableConfig {
  title = this.translate.instant('Kerberos Realms');
  queryCall = 'kerberos.realm.query' as const;
  wsDelete = 'kerberos.realm.delete' as const;
  protected entityList: EntityTableComponent;

  columns = [
    { name: this.translate.instant('Realm'), prop: 'realm', always_display: true },
    { name: this.translate.instant('KDC'), prop: 'kdc_string' },
    { name: this.translate.instant('Admin Server'), prop: 'admin_server_string' },
    { name: this.translate.instant('Password Server'), prop: 'kpasswd_server_string' },
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
    private slideInService: IxSlideInService,
    private translate: TranslateService,
  ) { }

  resourceTransformIncomingRestData(realms: KerberosRealm[]): KerberosRealmRow[] {
    return realms.map((realm) => {
      return {
        ...realm,
        kdc_string: realm.kdc?.join(', '),
        admin_server_string: realm.admin_server?.join(', '),
        kpasswd_server_string: realm.kpasswd_server?.join(', '),
      };
    });
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  getAddActions(): EntityTableAction[] {
    return [{
      label: this.translate.instant('Add'),
      onClick: () => this.doAdd(),
    }] as EntityTableAction[];
  }

  getActions(): EntityTableAction[] {
    return [
      {
        id: 'edit',
        label: this.translate.instant('Edit'),
        onClick: (realm: KerberosRealmRow) => {
          const modal = this.slideInService.open(KerberosRealmsFormComponent);
          modal.setRealmForEdit(realm);
        },
      },
      {
        id: 'delete',
        label: this.translate.instant('Delete'),
        onClick: (realm: KerberosRealmRow) => {
          this.entityList.doDelete(realm);
        },
      },
    ] as EntityTableAction[];
  }

  doAdd(): void {
    this.slideInService.open(KerberosRealmsFormComponent);
  }
}
