import { Component } from '@angular/core';

import { T } from "app/translate-marker";
import { WebSocketService, DialogService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
    selector: 'app-ssh-keypairs-list',
    template: `<entity-table [title]='title' [conf]='this'></entity-table>`,
})
export class SshKeypairsListComponent {

    public title = "SSH Keypairs";
    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [[["type", "=", "SSH_KEY_PAIR"]]];
    protected wsDelete = 'keychaincredential.delete';
    protected route_add: string[] = ['system', 'sshkeypairs', 'add'];
    protected route_add_tooltip = "Add SSH Keypairs";
    protected route_edit: string[] = ['system', 'sshkeypairs', 'edit'];
    protected route_success: string[] = ['system', 'sshconnections'];
    protected entityList: any;

    public columns: Array<any> = [
        { name: T('Name'), prop: 'name', always_display: true },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: T('SSH Keypairs'),
            key_props: ['name']
        },
    };
    public methodTextDict = {
        disable: 'disabled',
        delete: 'deleted',
    }

    getActions(parentRow) {
        return [{
            id: "edit",
            label: T("Edit"),
            onClick: (rowinner) => { this.entityList.doEdit(rowinner.id); },
        }, {
            id: "delete",
            label: T("Delete"),
            onClick: (rowinner) => {
                const usedBy = {};
                this.ws.call('keychaincredential.used_by', [rowinner.id]).subscribe((res) => {
                    for (const item of res) {
                        if (usedBy[item.unbind_method] == undefined) {
                            usedBy[item.unbind_method] = [];
                        }
                        usedBy[item.unbind_method].push(item.title);
                    }

                    let deletemsg = T('<p>Delete the <i>') + rowinner.name + T('</i> keypair?</p>');
                    for (const method in usedBy) {
                        deletemsg += T('These items will be <b>') + this.methodTextDict[method] + (method === 'delete' ? T('</b> with the keypair') : '</b>') + 
                            ':<ul class="styled-list-for-dialogs">';
                        for (let i = 0; i < usedBy[method].length; i++) {
                            deletemsg += '<li>' + usedBy[method][i] + '</li>';
                        }
                        deletemsg += '</ul>';
                    }

                    this.dialogService.confirm(T('Delete'), deletemsg, false, T('Delete')).subscribe((dialogRes) => {
                        if (dialogRes) {
                            this.entityList.loader.open();
                            this.entityList.loaderOpen = true;
                            this.entityList.busy = this.ws.call(this.wsDelete, [rowinner.id, {"cascade": true}]).subscribe(
                                (resinner) => { this.entityList.getData() },
                                (resinnererr) => {
                                new EntityUtils().handleWSError(this, resinnererr, this.dialogService);
                                this.entityList.loader.close();
                                }
                            );
                        }
                    });
                });
            }
        }];
    };

    constructor(private ws: WebSocketService, private dialogService: DialogService) {}

    afterInit(entityList: any) {
        this.entityList = entityList;
    }
}