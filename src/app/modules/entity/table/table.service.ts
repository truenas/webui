import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableConfirmDeleteDialog, TableComponent } from 'app/modules/entity/table/table.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, AppLoaderService } from 'app/services';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable()
export class TableService {
  protected dialogRef: MatDialogRef<EntityJobComponent>;

  constructor(
    private ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private matDialog: MatDialog,
  ) { }

  // get table data source
  getData(table: TableComponent): void {
    this.ws.call(table.tableConf.queryCall, table.tableConf.queryCallOption)
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (table.tableConf.dataSourceHelper) {
          res = table.tableConf.dataSourceHelper(res);
        }
        if (table.tableConf.afterGetDataExpandable) {
          res = table.tableConf.afterGetDataExpandable(res);
        }
        if (table.tableConf.getInOutInfo) {
          table.tableConf.getInOutInfo(res);
        }
        table.dataSource = res;
        if (!(table.dataSource?.length > 0)) {
          table.emptyConf = {
            type: EmptyType.NoPageData,
            large: table.entityEmptyLarge,
            title: this.translate.instant(T('No {title} configured'), { title: table.title }),
          };
          if (table.tableConf.add) {
            table.emptyConf.message = this.translate.instant(T('To configure {title} click the "Add" button.'), { title: table.title });
          }
        }
        if (table.limitRows) {
          if (table.enableViewMore) {
            table.displayedDataSource = table.dataSource.slice(0, table.dataSource.length);
          } else {
            table.displayedDataSource = table.dataSource.slice(0, table.limitRows - 1);
            table.showViewMore = table.dataSource.length !== table.displayedDataSource.length;
          }
        }
        if (table.loaderOpen) {
          this.loader.close();
        }

        if (table.tableConf.afterGetData) {
          table.tableConf.afterGetData(res);
        }

        table.afterGetDataHook$.next();
      });
  }

  delete(table: TableComponent, item: Record<string, any>, action?: string): void {
    const deleteMsg: string = table.tableConf.confirmDeleteDialog?.isMessageComplete
      ? ''
      : this.getDeleteMessage(table, item, action);

    const dialog = table.tableConf.confirmDeleteDialog || {} as AppTableConfirmDeleteDialog;
    if (dialog.buildTitle) {
      dialog.title = dialog.buildTitle(item);
    }
    if (dialog.buttonMsg) {
      dialog.button = dialog.buttonMsg(item);
    }

    if (table.tableConf.deleteMsg && table.tableConf.deleteMsg.doubleConfirm) {
      // double confirm: input delete item's name to confirm deletion
      table.tableConf.deleteMsg.doubleConfirm(item).pipe(untilDestroyed(this)).subscribe((doubleConfirmDialog) => {
        if (doubleConfirmDialog) {
          this.doDelete(table, item);
        }
      });
    } else {
      this.dialog.confirm({
        title: dialog.hasOwnProperty('title') ? dialog['title'] : T('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog['message'] + deleteMsg : deleteMsg,
        hideCheckBox: dialog.hasOwnProperty('hideCheckbox') ? dialog['hideCheckbox'] : false,
        buttonMsg: dialog.hasOwnProperty('button') ? dialog['button'] : T('Delete'),
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.doDelete(table, item);
      });
    }
  }

  // generate delete msg
  getDeleteMessage(table: TableComponent, item: Record<string, unknown>, action: string = T('Delete ')): string {
    let deleteMsg: string = T('Delete the selected item?');
    if (table.tableConf.deleteMsg) {
      deleteMsg = action + table.tableConf.deleteMsg.title;
      let message = ' <b>' + String(item[table.tableConf.deleteMsg.key_props[0]]);
      if (table.tableConf.deleteMsg.key_props.length > 1) {
        for (let i = 1; i < table.tableConf.deleteMsg.key_props.length; i++) {
          if (item[table.tableConf.deleteMsg.key_props[i]] !== '') {
            message = message + ' - ' + String(item[table.tableConf.deleteMsg.key_props[i]]);
          }
        }
      }
      message += '</b>?';
      deleteMsg += message;
    }

    return this.translate.instant(deleteMsg);
  }

  doDelete(table: TableComponent, item: Record<string, unknown>): void {
    if (table.tableConf.deleteCallIsJob) {
      this.loader.open();
      table.loaderOpen = true;
    }

    let id: string | number;
    if (table.tableConf.deleteMsg && table.tableConf.deleteMsg.id_prop) {
      id = item[table.tableConf.deleteMsg.id_prop] as string | number;
    } else {
      id = item.id as string | number;
    }
    const params = table.tableConf.getDeleteCallParams ? table.tableConf.getDeleteCallParams(item, id) : [id];

    if (!table.tableConf.deleteCallIsJob) {
      this.ws.call(table.tableConf.deleteCall, params).pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.getData(table);
          if (table.tableConf.afterDelete) {
            table.tableConf.afterDelete();
          }
        },
        error: (error: WebsocketError) => {
          new EntityUtils().handleWsError(this, error, this.dialog);
          this.loader.close();
          table.loaderOpen = false;
        },
      });
    } else {
      this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Deleting...') } });
      this.dialogRef.componentInstance.setCall(table.tableConf.deleteCall, params);
      this.dialogRef.componentInstance.submit();
      this.dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
        this.dialogRef.close(true);
        this.getData(table);
        if (table.tableConf.afterDelete) {
          table.tableConf.afterDelete();
        }
      });
      this.dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
        this.loader.close();
        table.loaderOpen = false;
        new EntityUtils().handleWsError(this, err, this.dialog);
      });
    }
  }

  updateStateInfoIcon(elemntId: string, type: 'sent' | 'received'): void {
    const targetEl = document.getElementById(elemntId);
    const targetIcon = targetEl.firstElementChild;
    if (targetIcon) {
      const arrowIcons = targetIcon.getElementsByClassName('arrow');
      const targetIconEl = type === 'sent' ? arrowIcons[0] : arrowIcons[1];

      setTimeout(() => {
        targetIconEl.classList.add('active');
      }, 0);

      setTimeout(() => {
        targetIconEl.classList.remove('active');
      }, 2000);
    }
  }
}
