import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { IscsiExtentType } from 'app/enums/iscsi.enum';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import {
  DeleteExtentDialogComponent,
} from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-extent-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
})
export class ExtentListComponent implements EntityTableConfig<IscsiExtent> {
  tableTitle = this.translate.instant('Extents');
  protected entityTable: EntityTableComponent<IscsiExtent>;
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
      name: this.translate.instant('Device/File'),
      prop: 'deviceOrFile',
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
    private translate: TranslateService,
    private dialog: MatDialog,
  ) {}

  resourceTransformIncomingRestData(extents: IscsiExtent[]): (IscsiExtent & { deviceOrFile: string })[] {
    return extents.map((extent) => ({
      ...extent,
      deviceOrFile: extent.type === IscsiExtentType.Disk ? extent.disk : extent.path,
    }));
  }

  afterInit(entityList: EntityTableComponent<IscsiExtent>): void {
    this.entityTable = entityList;
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(ExtentFormComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityTable.getData());
  }

  doEdit(id: number): void {
    const extent = this.entityTable.rows.find((row) => row.id === id);
    const slideInRef = this.slideInService.open(ExtentFormComponent, { wide: true, data: extent });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityTable.getData());
  }

  getActions(): EntityTableAction[] {
    return [{
      name: 'edit',
      id: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (rowinner: IscsiExtent) => this.entityTable.doEdit(rowinner.id),
    }, {
      name: 'delete',
      id: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: IscsiExtent) => this.showDeleteDialog(rowinner),
    }] as EntityTableAction[];
  }

  showDeleteDialog(extent: IscsiExtent): void {
    this.dialog.open(DeleteExtentDialogComponent, { data: extent })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasDeleted) => {
        if (!wasDeleted) {
          return;
        }

        this.entityTable.getData();
      });
  }
}
