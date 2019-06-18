import { Component } from '@angular/core';

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
        { name: 'Name', prop: 'name' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'SSH Keypairs',
            key_props: ['name']
        },
    };

    getActions(parentRow) {
        return [{
            id: "edit",
            label: "Edit",
            onClick: (rowinner) => { this.entityList.doEdit(rowinner.id); },
        }, {
            id: "delete",
            label: "Delete",
            onClick: (rowinner) => {
                const usedBy = {};
                this.ws.call('keychaincredential.used_by', [rowinner.id]).subscribe((res) => {
                    for (const item of res) {
                        if (usedBy[item.unbind_method] == undefined) {
                            usedBy[item.unbind_method] = [];
                        }
                        usedBy[item.unbind_method].push(item.title);
                    }
                    let deletemsg = '<p>Delete ' + this.config.deleteMsg.title + ' ' + rowinner.name + '?</p><br>';
                    for (const item in usedBy) {
                        deletemsg += '<ul> The following objects will be ' + item.toUpperCase();
                        for (let i = 0; i < usedBy[item].length; i++) {
                            deletemsg += '<li>' + usedBy[item][i] + '</li>';
                        }
                        deletemsg += '</ul>';
                    }

                    this.dialogService.confirm('Delete', deletemsg, false, 'Delete').subscribe((dialogRes) => {
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