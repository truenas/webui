import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';
import { InitshutdownFormComponent } from '../initshutdown-form/initshutdown-form.component';

@UntilDestroy()
@Component({
  selector: 'app-initshutdown-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class InitshutdownListComponent implements EntityTableConfig {
  title = 'Init/Shutdown Scripts';
  queryCall: 'initshutdownscript.query' = 'initshutdownscript.query';
  wsDelete: 'initshutdownscript.delete' = 'initshutdownscript.delete';
  route_add: string[] = ['tasks', 'initshutdown', 'add'];
  route_add_tooltip = 'Add Init/Shutdown Scripts';
  route_edit: string[] = ['tasks', 'initshutdown', 'edit'];
  protected entityList: EntityTableComponent;

  columns = [
    { name: T('Type'), prop: 'type' },
    { name: T('Command'), prop: 'command', hidden: true },
    { name: T('Script'), prop: 'script', hidden: true },
    { name: T('Description'), prop: 'comment' },
    { name: T('When'), prop: 'when' },
    { name: T('Enabled'), prop: 'enabled' },
    { name: T('Timeout'), prop: 'timeout', hidden: true },
  ];
  rowIdentifier = 'type';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: T('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
  };

  constructor(public modalService: ModalService) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.modalService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.loaderOpen = true;
      this.entityList.needRefreshTable = true;
      this.entityList.getData();
    });
  }

  doAdd(id?: number): void {
    this.modalService.openInSlideIn(InitshutdownFormComponent, id);
  }

  doEdit(id: number): void {
    this.doAdd(id);
  }
}
