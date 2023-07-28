import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { Observable, forkJoin } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { IscsiExtent, IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/associated-target/associated-target-form/associated-target-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-associated-target-list',
  template: `
    <ix-entity-table [conf]="this" [title]="tableTitle"></ix-entity-table>
  `,
  providers: [IscsiService],
})
export class AssociatedTargetListComponent implements EntityTableConfig {
  tableTitle = 'Associated Targets';
  queryCall = 'iscsi.targetextent.query' as const;
  wsDelete = 'iscsi.targetextent.delete' as const;
  routeAddTooltip = this.translate.instant('Add Target/Extent');

  columns = [
    {
      name: this.translate.instant('Target'),
      prop: 'targetName',
      always_display: true,
    },
    {
      name: this.translate.instant('LUN ID'),
      prop: 'lunid',
    },
    {
      name: this.translate.instant('Extent'),
      prop: 'extentName',
    },
  ];
  rowIdentifier = 'target';
  config = {
    paging: true,
    sorting: { columns: this.columns },
    deleteMsg: {
      title: 'Target/Extent',
      key_props: ['targetName', 'extentName'],
    },
  };

  protected entityList: EntityTableComponent;

  constructor(
    private errorHandler: ErrorHandlerService,
    private iscsiService: IscsiService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;
  }

  dataHandler(entityList: EntityTableComponent): Observable<[IscsiTarget[], IscsiExtent[]]> {
    entityList.rows.forEach((row) => {
      row.targetName = '...';
      row.extentName = '...';
    });

    return forkJoin([
      this.iscsiService.getTargets(),
      this.iscsiService.getExtents(),
    ]).pipe(
      tap(([targets, extents]) => {
        entityList.rows.forEach((row) => {
          row.targetName = _.find(targets, { id: row.target as number }).name;
          row.extentName = _.find(extents, { id: row.extent as number }).name;
        });
      }),
    );
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AssociatedTargetFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  getActions(row: IscsiTargetExtent): EntityTableAction[] {
    return [{
      id: row.target,
      name: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (rowInner: IscsiTargetExtent) => {
        this.editRow(rowInner);
      },
    }, {
      id: row.target,
      name: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowInner: IscsiTargetExtent) => {
        this.deleteRow(rowInner);
      },
    }];
  }

  private editRow(extent: IscsiTargetExtent): void {
    const slideInRef = this.slideInService.open(AssociatedTargetFormComponent, { data: extent });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.entityList.getData());
  }

  private deleteRow(rowInner: IscsiTargetExtent): void {
    let deleteMsg = this.entityList.getDeleteMessage(rowInner);
    this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
      (sessions) => {
        let warningMsg = '';
        sessions.forEach((session) => {
          if (Number(session.target.split(':')[1]) === rowInner.target) {
            warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
          }
        });
        deleteMsg = warningMsg + deleteMsg;

        this.dialogService.confirm({
          title: this.translate.instant('Delete'),
          message: deleteMsg,
          buttonText: this.translate.instant('Delete'),
        }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
          this.loader.open();
          this.entityList.loaderOpen = true;
          this.ws.call(this.wsDelete, [rowInner.id, true]).pipe(untilDestroyed(this)).subscribe({
            next: () => this.entityList.getData(),
            error: (error: WebsocketError) => {
              this.dialogService.error(this.errorHandler.parseWsError(error));
              this.loader.close();
            },
          });
        });
      },
    );
  }
}
