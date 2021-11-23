import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';

@Component({
  selector: 'app-rsync-module-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class RsyncModuleListComponent implements EntityTableConfig {
  title = this.translate.instant('RSYNC Modules');
  queryCall = 'rsyncmod.query' as const;
  hasDetails = true;
  wsDelete = 'rsyncmod.delete' as const;
  routeAdd: string[] = ['services', 'rsync', 'rsync-module', 'add'];
  routeEdit: string[] = ['services', 'rsync', 'rsync-module', 'edit'];
  protected routeDelete: string[] = ['services', 'rsync', 'rsync-module', 'delete'];

  columns = [
    { name: this.translate.instant('Name'), prop: 'name' },
    { name: this.translate.instant('Comment'), prop: 'comment' },
    { name: this.translate.instant('Path'), prop: 'path' },
    { name: this.translate.instant('Mode'), prop: 'mode' },
    { name: this.translate.instant('Maximum connections'), prop: 'maxconn', hidden: true },
    { name: this.translate.instant('User'), prop: 'user', hidden: true },
    { name: this.translate.instant('Group'), prop: 'group', hidden: true },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
    { name: this.translate.instant('Host Allow'), prop: 'hostsallow', hidden: true },
    { name: this.translate.instant('Host Deny'), prop: 'hostsdeny', hidden: true },
    { name: this.translate.instant('Auxiliary parameters'), prop: 'auxiliary', hidden: true },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
  };

  constructor(protected translate: TranslateService) {}

  dataHandler(entityTable: EntityTableComponent): void {
    const rows = entityTable.rows;
    rows.forEach((row) => {
      row.details = [];
      row.details.push({ label: this.translate.instant('Maximum connections'), value: row['maxconn'] },
        { label: this.translate.instant('Host Allow'), value: row['hostsallow'] },
        { label: this.translate.instant('Host Deny'), value: row['hostsdeny'] },
        { label: this.translate.instant('Auxiliary parameters'), value: row['auxiliary'] });
    });
  }
}
