import { Inject, Injectable, Optional } from "@angular/core";
import { TranslateService } from '@ngx-translate/core';

import { DialogService, AppLoaderService } from '../../../../services';
import { T } from '../../../../translate-marker';
import { EntityUtils } from '../utils';

const stateClass = {
    UP: 'STATE_UP',
    DOWN: 'STATE_DOWN',
}

@Injectable()
export class TableService {

    constructor(
        private dialogService: DialogService,
        private loader: AppLoaderService,
        private translateService: TranslateService) { }

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
            if (table.limitRows) {
                table.displayedDataSource = table.dataSource.slice(0, table.limitRows - 1);
                table.showViewMore = table.dataSource.length !== table.displayedDataSource.length;
            }
            if (table.loaderOpen) {
                this.loader.close();
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
        this.loader.open();
        table.loaderOpen = true;
        const data = {};

        let id;
        if (table.tableConf.deleteMsg && table.tableConf.deleteMsg.id_prop) {
            id = item[table.tableConf.config.deleteMsg.id_prop];
        } else {
            id = item.id;
        }

        table.busy = table.ws.call(table.tableConf.deleteCall, (table.tableConf.getDeleteCallParams ? table.tableConf.getDeleteCallParams(item, id) : [id])).subscribe(
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
            }
        )
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