import { Component } from '@angular/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { T } from 'app/translate-marker';

@Component({
  selector: 'app-rsync-module-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class RsyncConfigurationListComponent implements EntityTableConfig {
  title = 'RSYNC Modules';
  queryCall: 'rsyncmod.query' = 'rsyncmod.query';
  hasDetails = true;
  wsDelete: 'rsyncmod.delete' = 'rsyncmod.delete';
  route_add: string[] = ['services', 'rsync', 'rsync-module', 'add'];
  route_edit: string[] = ['services', 'rsync', 'rsync-module', 'edit'];
  protected route_delete: string[] = ['services', 'rsync', 'rsync-module', 'delete'];

  columns = [
    { name: T('Name'), prop: 'name' },
    { name: T('Comment'), prop: 'comment' },
    { name: T('Path'), prop: 'path' },
    { name: T('Mode'), prop: 'mode' },
    { name: T('Maximum connections'), prop: 'maxconn', hidden: true },
    { name: T('User'), prop: 'user', hidden: true },
    { name: T('Group'), prop: 'group', hidden: true },
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Host Allow'), prop: 'hostsallow', hidden: true },
    { name: T('Host Deny'), prop: 'hostsdeny', hidden: true },
    { name: T('Auxiliary parameters'), prop: 'auxiliary', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };

  dataHandler(entityTable: EntityTableComponent): void {
    const rows = entityTable.rows;
    rows.forEach((row) => {
      row.details = [];
      row.details.push({ label: T('Maximum connections'), value: row['maxconn'] },
        { label: T('Host Allow'), value: row['hostsallow'] },
        { label: T('Host Deny'), value: row['hostsdeny'] },
        { label: T('Auxiliary parameters'), value: row['auxiliary'] });
    });
  }
}
