import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Choices } from 'app/interfaces/choices.interface';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { IscsiService } from 'app/services';
import { T } from 'app/translate-marker';

@Component({
  selector: 'app-iscsi-portal-list',
  template: `
    <entity-table [conf]="this" [title]="tableTitle"></entity-table>
  `,
})
export class PortalListComponent implements EntityTableConfig {
  tableTitle = 'Portals';
  queryCall: 'iscsi.portal.query' = 'iscsi.portal.query';
  wsDelete: 'iscsi.portal.delete' = 'iscsi.portal.delete';
  route_add: string[] = ['sharing', 'iscsi', 'portals', 'add'];
  route_add_tooltip = 'Add Portal';
  route_edit: string[] = ['sharing', 'iscsi', 'portals', 'edit'];

  columns = [
    {
      name: T('Portal Group ID'),
      prop: 'tag',
      always_display: true,
    },
    {
      name: T('Listen'),
      prop: 'listen',
    },
    {
      name: T('Description'),
      prop: 'comment',
    },
    {
      name: T('Discovery Auth Method'),
      prop: 'discovery_authmethod',
    },
    {
      name: T('Discovery Auth Group'),
      prop: 'discovery_authgroup',
    },
  ];
  rowIdentifier = 'tag';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Portal',
      key_props: ['tag'],
    },
  };
  ipChoices: Choices;
  constructor(protected router: Router, protected iscsiService: IscsiService) {}

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
        const listenIP = this.ipChoices[row.listen[ip].ip] || row.listen[ip].ip;
        row.listen[ip] = listenIP + ':' + row.listen[ip].port;
      }
    });
  }
}
