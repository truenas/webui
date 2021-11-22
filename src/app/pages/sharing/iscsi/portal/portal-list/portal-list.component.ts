import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Choices } from 'app/interfaces/choices.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { IscsiService } from 'app/services';

@Component({
  selector: 'app-iscsi-portal-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class PortalListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Portals');
  queryCall = 'iscsi.portal.query' as const;
  wsDelete = 'iscsi.portal.delete' as const;
  route_add: string[] = ['sharing', 'iscsi', 'portals', 'add'];
  route_add_tooltip = this.translate.instant('Add Portal');
  route_edit: string[] = ['sharing', 'iscsi', 'portals', 'edit'];

  columns = [
    {
      name: this.translate.instant('Portal Group ID'),
      prop: 'tag',
      always_display: true,
    },
    {
      name: this.translate.instant('Listen'),
      prop: 'listen',
    },
    {
      name: this.translate.instant('Description'),
      prop: 'comment',
    },
    {
      name: this.translate.instant('Discovery Auth Method'),
      prop: 'discovery_authmethod',
    },
    {
      name: this.translate.instant('Discovery Auth Group'),
      prop: 'discovery_authgroup',
    },
  ];
  rowIdentifier = 'tag';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Portal'),
      key_props: ['tag'],
    },
  };
  ipChoices: Choices;

  constructor(
    protected router: Router,
    protected iscsiService: IscsiService,
    protected translate: TranslateService,
  ) {}

  prerequisite(): Promise<boolean> {
    return new Promise(async (resolve) => {
      await this.iscsiService.getIpChoices().toPromise().then(
        (ips) => {
          this.ipChoices = ips;
          resolve(true);
        },
        () => {
          resolve(true);
        },
      );
    });
  }

  dataHandler(entityTable: EntityTableComponent): void {
    entityTable.rows.forEach((row) => {
      for (const ip in row.listen) {
        const listenIp = this.ipChoices[row.listen[ip].ip] || row.listen[ip].ip;
        row.listen[ip] = listenIp + ':' + row.listen[ip].port;
      }
    });
  }
}
