import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import {
  RsyncModuleFormComponent,
} from 'app/pages/services/components/service-rsync/rsync-module-form/rsync-module-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-rsync-module-list',
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class RsyncModuleListComponent implements EntityTableConfig, OnInit {
  title = this.translate.instant('RSYNC Modules');
  queryCall = 'rsyncmod.query' as const;
  hasDetails = true;
  wsDelete = 'rsyncmod.delete' as const;
  entityList: EntityTableComponent;
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

  constructor(
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.slideInService.onClose$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.entityList.getData());
  }

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

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

  doAdd(): void {
    this.slideInService.open(RsyncModuleFormComponent, { wide: true });
  }

  doEdit(id: number): void {
    const row = this.entityList.rows.find((row) => row.id === id);
    const form = this.slideInService.open(RsyncModuleFormComponent, { wide: true });
    form.setModuleForEdit(row);
  }
}
