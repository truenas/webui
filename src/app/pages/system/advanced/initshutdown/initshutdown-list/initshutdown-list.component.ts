import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EntityTableComponent } from 'app/pages/common/entity/entity-table/entity-table.component';
import { EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { ModalService } from 'app/services/modal.service';
import { InitshutdownFormComponent } from '../initshutdown-form/initshutdown-form.component';

@UntilDestroy()
@Component({
  selector: 'app-initshutdown-list',
  template: '<entity-table [title]="title" [conf]="this"></entity-table>',
})
export class InitshutdownListComponent implements EntityTableConfig {
  title = 'Init/Shutdown Scripts';
  queryCall = 'initshutdownscript.query' as const;
  wsDelete = 'initshutdownscript.delete' as const;
  route_add: string[] = ['tasks', 'initshutdown', 'add'];
  route_add_tooltip = 'Add Init/Shutdown Scripts';
  route_edit: string[] = ['tasks', 'initshutdown', 'edit'];
  protected entityList: EntityTableComponent;

  columns = [
    { name: this.translate.instant('Type'), prop: 'type' },
    { name: this.translate.instant('Command'), prop: 'command', hidden: true },
    { name: this.translate.instant('Script'), prop: 'script', hidden: true },
    { name: this.translate.instant('Description'), prop: 'comment' },
    { name: this.translate.instant('When'), prop: 'when' },
    { name: this.translate.instant('Enabled'), prop: 'enabled' },
    { name: this.translate.instant('Timeout'), prop: 'timeout', hidden: true },
  ];
  rowIdentifier = 'type';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
  };

  constructor(
    public modalService: ModalService,
    protected translate: TranslateService,
  ) {}

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
