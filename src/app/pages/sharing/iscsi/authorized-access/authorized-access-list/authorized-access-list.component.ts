import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiAuthAccess } from 'app/interfaces/iscsi.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AuthorizedAccessFormComponent } from 'app/pages/sharing/iscsi/authorized-access/authorized-access-form/authorized-access-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-authorizedaccess-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
})
export class AuthorizedAccessListComponent implements EntityTableConfig<IscsiAuthAccess> {
  tableTitle = this.translate.instant('Authorized Access');
  queryCall = 'iscsi.auth.query' as const;
  wsDelete = 'iscsi.auth.delete' as const;
  routeAddTooltip = this.translate.instant('Add Authorized Access');
  entityList: EntityTableComponent<IscsiAuthAccess>;

  columns = [
    {
      name: this.translate.instant('Group ID'),
      prop: 'tag',
      always_display: true,
    },
    {
      name: this.translate.instant('User'),
      prop: 'user',
    },
    {
      name: this.translate.instant('Peer User'),
      prop: 'peeruser',
    },
  ];
  rowIdentifier = 'tag';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Authorized Access'),
      key_props: ['tag'],
    },
  };

  constructor(
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent<IscsiAuthAccess>): void {
    this.entityList = entityList;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AuthorizedAccessFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  doEdit(id: number, entityList: EntityTableComponent<IscsiAuthAccess>): void {
    const authAccess = entityList.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(AuthorizedAccessFormComponent, { data: authAccess });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }
}
