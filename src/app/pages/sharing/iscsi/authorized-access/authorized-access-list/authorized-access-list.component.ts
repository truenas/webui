import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
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
export class AuthorizedAccessListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Authorized Access');
  queryCall = 'iscsi.auth.query' as const;
  wsDelete = 'iscsi.auth.delete' as const;
  routeAddTooltip = this.translate.instant('Add Authorized Access');

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
    private router: Router,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      entityList.getData();
    });
  }

  doAdd(): void {
    this.slideInService.open(AuthorizedAccessFormComponent);
  }

  doEdit(id: number, entityList: EntityTableComponent): void {
    const row = entityList.rows.find((row) => row.id === id);
    const form = this.slideInService.open(AuthorizedAccessFormComponent);
    form.setAccessForEdit(row);
  }
}
