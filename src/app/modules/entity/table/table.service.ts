import { ChangeDetectorRef, Injectable, Optional } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ApiCallMethod, ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { ApiJobMethod } from 'app/interfaces/api/api-job-directory.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppTableConfirmDeleteDialog, TableComponent } from 'app/modules/entity/table/table.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
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
    private errorHandler: ErrorHandlerService,
    @Optional() private cdr: ChangeDetectorRef,
  ) { }

  // get table data source
  getData(table: TableComponent): void {
    this.ws.call(
      table.tableConf.queryCall,
      table.tableConf.queryCallOption as ApiCallParams<ApiCallMethod>,
    )
      .pipe(untilDestroyed(this))
      .subscribe((response: unknown[]) => {
        if (table.tableConf.dataSourceHelper) {
          response = table.tableConf.dataSourceHelper(response);
        }
        if (table.tableConf.afterGetDataExpandable) {
          response = table.tableConf.afterGetDataExpandable(response);
        }
        if (table.tableConf.getInOutInfo) {
          table.tableConf.getInOutInfo(response);
        }
        table.dataSource = response as Record<string, unknown>[];
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
          table.calculateLimitRows();
        }
        if (table.loaderOpen) {
          this.loader.close();
        }

        if (table.tableConf.afterGetData) {
          table.tableConf.afterGetData(response);
        }

        table.afterGetDataHook$.next();
        this.cdr?.markForCheck();
      });
  }

  delete(table: TableComponent, item: Record<string, unknown>, action?: string): void {
    const deleteMsg: string = table.tableConf.confirmDeleteDialog?.isMessageComplete
      ? ''
      : this.getDeleteMessage(table, item, action);

    const dialog = table.tableConf.confirmDeleteDialog || {} as AppTableConfirmDeleteDialog;
    if (dialog.buildTitle) {
      dialog.title = dialog.buildTitle(item);
    }
    if (dialog.buttonMessage) {
      dialog.button = dialog.buttonMessage(item);
    }

    if (table.tableConf.deleteMsg?.doubleConfirm) {
      // double confirm: input delete item's name to confirm deletion
      table.tableConf.deleteMsg.doubleConfirm(item).pipe(untilDestroyed(this)).subscribe((doubleConfirmDialog) => {
        if (doubleConfirmDialog) {
          this.doDelete(table, item);
        }
      });
    } else {
      this.dialog.confirm({
        title: dialog.hasOwnProperty('title') ? dialog.title : T('Delete'),
        message: dialog.hasOwnProperty('message') ? dialog.message + deleteMsg : deleteMsg,
        hideCheckbox: dialog.hasOwnProperty('hideCheckbox') ? dialog.hideCheckbox : false,
        buttonText: dialog.hasOwnProperty('button') ? dialog.button : T('Delete'),
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
    if (table.tableConf.deleteMsg?.id_prop) {
      id = item[table.tableConf.deleteMsg.id_prop] as string | number;
    } else {
      id = item.id as string | number;
    }
    const params = table.tableConf.getDeleteCallParams ? table.tableConf.getDeleteCallParams(item, id) : [id];

    if (!table.tableConf.deleteCallIsJob) {
      this.ws.call(table.tableConf.deleteCall as ApiCallMethod, params as ApiCallParams<ApiCallMethod>)
        .pipe(untilDestroyed(this)).subscribe({
          next: () => {
            this.getData(table);
            if (table.tableConf.afterDelete) {
              table.tableConf.afterDelete();
            }
          },
          error: (error: WebsocketError) => {
            this.dialog.error(this.errorHandler.parseWsError(error));
            this.loader.close();
            table.loaderOpen = false;
          },
        });
    } else {
      this.dialogRef = this.matDialog.open(EntityJobComponent, { data: { title: T('Deleting...') } });
      this.dialogRef.componentInstance.setCall(table.tableConf.deleteCall as ApiJobMethod, params);
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
        this.dialog.error(this.errorHandler.parseJobError(err));
      });
    }
  }

  // TODO: Remove in favor of a ix-interface-status-icon and classes
  updateStateInfoIcon(elemntId: string, type: 'sent' | 'received'): void {
    const targetEl = document.getElementById(elemntId);
    const targetIcon = targetEl?.firstElementChild;
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
