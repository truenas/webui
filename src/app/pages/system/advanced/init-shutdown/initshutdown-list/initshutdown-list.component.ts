import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  template: '<ix-entity-table [title]="title" [conf]="this"></ix-entity-table>',
})
export class InitshutdownListComponent implements EntityTableConfig {
  title = this.translate.instant('Init/Shutdown Scripts');
  queryCall = 'initshutdownscript.query' as const;
  wsDelete = 'initshutdownscript.delete' as const;
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
    public slideInService: IxSlideInService,
    protected translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  getActions(row: InitShutdownScript): EntityTableAction<InitShutdownScript>[] {
    return [
      {
        icon: 'edit',
        label: this.translate.instant('Edit'),
        name: 'edit',
        actionName: 'edit',
        onClick: (rowToEdit: InitShutdownScript) => {
          const slideInRef = this.slideInService.open(InitShutdownFormComponent, { data: rowToEdit });
          slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
            this.entityList.loaderOpen = true;
            this.entityList.needRefreshTable = true;
            this.entityList.getData();
          });
        },
      },
      {
        icon: 'delete',
        name: 'delete',
        actionName: 'delete',
        label: this.translate.instant('Delete'),
        onClick: () => {
          this.entityList.doDelete(row);
        },
      },
    ] as EntityTableAction<InitShutdownScript>[];
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(InitShutdownFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.loaderOpen = true;
      this.entityList.needRefreshTable = true;
      this.entityList.getData();
    });
  }
}
