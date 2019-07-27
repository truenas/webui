import { Component } from '@angular/core';

import { WebSocketService, DialogService } from '../../../../services';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
    selector: 'app-ssh-connections-list',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class SshConnectionsListComponent {
    public title = "SSH Connections";
    protected queryCall = 'keychaincredential.query';
    protected queryCallOption = [[["type", "=", "SSH_CREDENTIALS"]]];
    protected wsDelete = 'keychaincredential.delete';
    protected route_add: string[] = ['system', 'sshconnections', 'add'];
    protected route_add_tooltip = "Add SSH Connection";
    protected route_edit: string[] = ['system', 'sshconnections', 'edit'];
    protected route_delete: string[] = ['system', 'sshconnections', 'delete'];
    protected route_success: string[] = ['system', 'sshconnections'];
    protected entityList: any;

    public columns: Array<any> = [
        { name: 'Name', prop: 'name', always_display: true  },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'SSH Connections',
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
            },
        }]
    };

    constructor(private ws: WebSocketService, private dialogService: DialogService) {}

    afterInit(entityList: any) {
        this.entityList = entityList;
    }
}