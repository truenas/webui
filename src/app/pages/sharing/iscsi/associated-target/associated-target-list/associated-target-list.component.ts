import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { forkJoin } from 'rxjs';
import { filter } from 'rxjs/operators';
import { IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/associated-target/associated-target-form/associated-target-form.component';
import {
  AppLoaderService, DialogService, IscsiService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
    private router: Router,
    private iscsiService: IscsiService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {}

  afterInit(entityList: EntityTableComponent): void {
    this.entityList = entityList;

    this.slideInService.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.entityList.getData();
    });
  }

  dataHandler(entityList: EntityTableComponent): void {
    forkJoin([
      this.iscsiService.getTargets(),
      this.iscsiService.getExtents(),
    ]).pipe(untilDestroyed(this)).subscribe(([targets, extents]) => {
      entityList.rows.forEach((row) => {
        row.targetName = _.find(targets, { id: row.target })['name'];
        row.extentName = _.find(extents, { id: row.extent })['name'];
      });
    });
  }

  doAdd(): void {
    this.slideInService.open(AssociatedTargetFormComponent);
  }

  getActions(row: IscsiTargetExtent): EntityTableAction[] {
    return [{
      id: row.target,
      name: 'edit',
      icon: 'edit',
      label: this.translate.instant('Edit'),
      onClick: (extent: IscsiTargetExtent) => {
        const form = this.slideInService.open(AssociatedTargetFormComponent);
        form.setTargetForEdit(extent);
      },
    }, {
      id: row.target,
      name: 'delete',
      icon: 'delete',
      label: this.translate.instant('Delete'),
      onClick: (rowinner: IscsiTargetExtent) => {
        let deleteMsg = this.entityList.getDeleteMessage(rowinner);
        this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
          (sessions) => {
            let warningMsg = '';
            sessions.forEach((session) => {
              if (Number(session.target.split(':')[1]) === rowinner.target) {
                warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
              }
            });
            deleteMsg = warningMsg + deleteMsg;

            this.dialogService.confirm({
              title: this.translate.instant('Delete'),
              message: deleteMsg,
              buttonMsg: this.translate.instant('Delete'),
            }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
              this.loader.open();
              this.entityList.loaderOpen = true;
              this.ws.call(this.wsDelete, [rowinner.id, true]).pipe(untilDestroyed(this)).subscribe({
                next: () => this.entityList.getData(),
                error: (error: WebsocketError) => {
                  new EntityUtils().handleError(this, error);
                  this.loader.close();
                },
              });
            });
          },
        );
      },
    }];
  }
}
