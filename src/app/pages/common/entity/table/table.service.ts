import { Inject, Injectable, Optional } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';

import { DialogService, AppLoaderService } from '../../../../services';
import { MatDialog } from '@angular/material/dialog';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../utils';
import { EmptyType } from "../entity-empty/entity-empty.component";

const stateClass = {
    UP: 'STATE_UP',
    DOWN: 'STATE_DOWN',
}

@Injectable()
export class TableService {
    protected dialogRef: any;

    constructor(
        private dialogService: DialogService,
        private loader: AppLoaderService,
        private translateService: TranslateService,
        private mdDialog: MatDialog) { }

    // get table data source
    getData(table) {
        table.ws.call(table.tableConf.queryCall).subscribe(res => {
            if (table.tableConf.dataSourceHelper) {
                res = table.tableConf.dataSourceHelper(res);
            }
            if (table.tableConf.getInOutInfo) {
                table.tableConf.getInOutInfo(res);
            }
            table.dataSource = res;
            if(!(table.dataSource?.length > 0)) {
                table.emptyConf = {
                    type: EmptyType.no_page_data,
                    large: table.entityEmptyLarge,
                    title: T('No ')+table.title+T(' configured')
                };
                if(table.tableConf.add) {
                    table.emptyConf.message = T('To configure ')+table.title+(', click the "Add" button.')
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
            if(table.tableConf.afterGetData) {
                table.tableConf.afterGetData(res);
            }
        });
    }

    delete(table, item, action?) {
        const deleteMsg =
            table.tableConf.confirmDeleteDialog && table.tableConf.confirmDeleteDialog.isMessageComplete
                ? ''
                : this.getDeleteMessage(table, item, action);

        const dialog = table.tableConf.confirmDeleteDialog || {};
        if (dialog.buildTitle) {
            dialog.title = dialog.buildTitle(item);
        }
        if (dialog.buttonMsg) {
            dialog.button = dialog.buttonMsg(item);
        }

        if (table.tableConf.deleteMsg && table.tableConf.deleteMsg.doubleConfirm) {
            // double confirm: input delete item's name to confirm deletion
            table.tableConf.deleteMsg.doubleConfirm(item).subscribe((doubleConfirmDialog) => {
                if (doubleConfirmDialog) {
                    this.doDelete(table, item);
                }
            });
        } else {
            this.dialogService.confirm(
                dialog.hasOwnProperty("title") ? dialog['title'] : T("Delete"),
                dialog.hasOwnProperty("message") ? dialog['message'] + deleteMsg : deleteMsg,
                dialog.hasOwnProperty("hideCheckbox") ? dialog['hideCheckbox'] : false,
                dialog.hasOwnProperty("button") ? dialog['button'] : T("Delete")).subscribe((res) => {
                    if (res) {
                        this.doDelete(table, item);
                    }
                });
        }
    }

    // generate delete msg
    getDeleteMessage(table, item, action = T("Delete ")) {
        let deleteMsg = T("Delete the selected item?");
        if (table.tableConf.deleteMsg) {
            deleteMsg = action + table.tableConf.deleteMsg.title;
            let msg_content = ' <b>' + item[table.tableConf.deleteMsg.key_props[0]];
            if (table.tableConf.deleteMsg.key_props.length > 1) {
                for (let i = 1; i < table.tableConf.deleteMsg.key_props.length; i++) {
                    if (item[table.tableConf.deleteMsg.key_props[i]] != '') {
                        msg_content = msg_content + ' - ' + item[table.tableConf.deleteMsg.key_props[i]];
                    }
                }
            }
            msg_content += "</b>?";
            deleteMsg += msg_content;
        }
        this.translateService.get(deleteMsg).subscribe((res) => {
            deleteMsg = res;
        });
        return deleteMsg;
    }

    // excute deletion of item
    doDelete(table, item) {
        if (table.tableConf.deleteCallIsJob) {
            this.loader.open();
            table.loaderOpen = true;
        }
        const data = {};

        let id;
        if (table.tableConf.deleteMsg && table.tableConf.deleteMsg.id_prop) {
            id = item[table.tableConf.config.deleteMsg.id_prop];
        } else {
            id = item.id;
        }
        const params = table.tableConf.getDeleteCallParams ? table.tableConf.getDeleteCallParams(item, id) : [id];

        if (!table.tableConf.deleteCallIsJob) {
            table.busy = table.ws.call(table.tableConf.deleteCall, params).subscribe(
                (resinner) => {
                    this.getData(table);
                    table.excuteDeletion = true;
                    if (table.tableConf.afterDelete) {
                        table.tableConf.afterDelete();
                    }
                },
                (resinner) => {
                    new EntityUtils().handleWSError(this, resinner, this.dialogService);
                    this.loader.close();
                    table.loaderOpen = false;
                }
            )
        } else {
            this.dialogRef = this.mdDialog.open(EntityJobComponent, { data: { "title": T('Deleting...') }, disableClose: false });
            this.dialogRef.componentInstance.setCall(table.tableConf.deleteCall, params);
            this.dialogRef.componentInstance.submit();
            this.dialogRef.componentInstance.success.subscribe(() => {
              this.dialogRef.close(true);
              this.getData(table);
              table.excuteDeletion = true;
              if (table.tableConf.afterDelete) {
                  table.tableConf.afterDelete();
              }
  
            });
            this.dialogRef.componentInstance.failure.subscribe((err) => {
                this.loader.close();
                table.loaderOpen = false;
                new EntityUtils().handleWSError(this, err, this.dialogService);
            });
        }
    }

    unifyState(state) {
        switch(state.toUpperCase()) {
          case 'UP':
            return stateClass.UP;
            break;
          case 'DOWN':
            return stateClass.DOWN;
        }
    }

    updateStateInfoIcon(elemntId, type: 'sent' | 'received') {
        const targetEl = document.getElementById(elemntId);
        const targetIcon = targetEl.firstElementChild;
        if (targetIcon) {
            const arrowIcons = targetIcon.getElementsByClassName('arrow');
            const targetIconEl = type === 'sent' ? arrowIcons[0] : arrowIcons[1];

            setTimeout(function(){
                targetIconEl.classList.add('active');
            }, 0);

        setTimeout(function(){
            targetIconEl.classList.remove('active');
        }, 2000);
        }
    }
}