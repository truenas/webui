import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-extent-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
})
export class ExtentListComponent implements EntityTableConfig {
  tableTitle = this.translate.instant('Extents');
  protected entityTable: EntityTableComponent;
  queryCall = 'iscsi.extent.query' as const;
  routeAdd: string[] = ['sharing', 'iscsi', 'extent', 'add'];
  routeAddTooltip = this.translate.instant('Add Extent');
  routeEdit: string[] = ['sharing', 'iscsi', 'extent', 'edit'];
  wsDelete = 'iscsi.extent.delete' as const;

  columns = [
    {
      name: this.translate.instant('Extent Name'),
      prop: 'name',
      always_display: true,
    },
    {
      name: this.translate.instant('Description'),
      prop: 'comment',
    },
    {
      name: this.translate.instant('Serial'),
      prop: 'serial',
    },
    {
      name: this.translate.instant('NAA'),
      prop: 'naa',
    },
    {
      name: this.translate.instant('Enabled'),
      prop: 'enabled',
    },
  ];
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: this.translate.instant('Extent'),
      key_props: ['name'],
    },
  };

  constructor(
    private slideInService: IxSlideInService,
    protected translate: TranslateService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityTable = entityList;
    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      entityList.getData();
    });
  }

  doAdd(): void {
    this.slideInService.open(ExtentFormComponent, { wide: true });
  }

  doEdit(id: string): void {
    const row = this.entityTable.rows.find((row) => row.id === id);
    const form = this.slideInService.open(ExtentFormComponent, { wide: true });
    form.setExtentForEdit(row);
  }

  getActions(): EntityTableAction[] {
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (rowinner: IscsiExtent) => { this.entityTable.doEdit(rowinner.id); },
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: IscsiExtent) => { this.doDelete(rowinner); },
    }] as EntityTableAction[];
  }

  doDelete(row: IscsiExtent): void {
    const id = row.id;
    const entityTable = this.entityTable;
    const isFile = row.type === IscsiExtentType.File;
    const deleteMsg = entityTable.getDeleteMessage(row);
    const conf: DialogFormConfiguration = {
      title: this.translate.instant('Delete iSCSI extent {name}?', { name: row.name }),
      fieldConfig: [
        {
          type: 'paragraph',
          name: 'delete_msg',
          paraText: deleteMsg,
        },
        {
          type: 'checkbox',
          name: 'remove',
          placeholder: this.translate.instant('Remove file?'),
          isHidden: !isFile,
          value: false,
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: this.translate.instant('Force'),
          value: false,
        },
      ],
      saveButtonText: this.translate.instant('Delete'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        const value = entityDialog.formValue;
        entityTable.loader.open();
        entityTable.loaderOpen = true;
        entityTable.ws.call(this.wsDelete, [id, value.remove, value.force]).pipe(untilDestroyed(this)).subscribe({
          next: () => {
            entityDialog.dialogRef.close(true);
            entityTable.getData();
            entityTable.excuteDeletion = true;
          },
          error: (err: WebsocketError) => {
            entityTable.loader.close();
            new EntityUtils().handleWsError(entityTable, err, entityTable.dialogService);
          },
        });
      },
    };
    this.entityTable.dialogService.dialogForm(conf);
  }
}
