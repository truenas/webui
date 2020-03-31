import { Component } from '@angular/core';

import { DialogFormConfiguration } from '../common/entity/entity-dialog/dialog-form-configuration.interface';
import { FieldConfig } from '../common/entity/entity-form/models/field-config.interface';
import { DialogService, WebSocketService } from '../../services';
import helptext from '../../helptext/api-keys';

@Component({
    selector: 'app-api-keys',
    template: `<entity-table [title]="title" [conf]="this"></entity-table>`,
})
export class ApiKeysComponent {
    public title = "API Keys";
    public queryCall = "apikeys.query";
    public wsDelete = "apikeys.delete";
    protected route_add_tooltip = "Add API Key";
    public addCall = "";
    public editCall = "";

    public pk;
    public columns: Array<any> = [
        { name: 'Name', prop: 'name', always_display: true },
        { name: 'Created Date', prop: 'create_date' },
    ];
    public config: any = {
        paging: true,
        sorting: { columns: this.columns },
        deleteMsg: {
            title: 'APK Key',
            key_props: ['id']
        },
    };

    public saveConfigFieldConf: FieldConfig[] = [
        {
            type: 'input',
            name: 'name',
            placeholder: helptext.name.placeholder,
            tooltip: helptext.name.tooltip,
        }
    ];
    public apikeysFormConf: DialogFormConfiguration = {
        title: helptext.formDialog.add_title,
        fieldConfig: this.saveConfigFieldConf,
        method_ws: this.addCall,
        saveButtonText: helptext.formDialog.add_button,
        customSubmit: this.doSubmit,
        parent: this,
      }

    protected custActions = [
        {
            id: 'add',
            name: 'ADD',
            function: () => {
                this.apikeysFormConf.title = helptext.formDialog.add_title;
                this.apikeysFormConf.saveButtonText = helptext.formDialog.add_button;
                this.apikeysFormConf.method_ws = this.addCall;

                this.dialogService.dialogForm(this.apikeysFormConf);
            }
        },
        {
            id: 'doc',
            name: 'docs',
            function: () => {
                window.open(window.location.origin + '/api/docs');
            }
        },
    ]

    constructor(
        private dialogService: DialogService,
        private ws: WebSocketService) {}
    afterInit(entityTable) {

    }
    doSubmit(entityDialogForm) {
        // do add/delete
    }

    getActions(row) {
        return [{
            name: 'edit',
            id: "edit",
            icon: 'edit',
            label: "Edit",
            onClick: (rowinner) => {
                this.apikeysFormConf.title = helptext.formDialog.edit_title;
                this.apikeysFormConf.saveButtonText = helptext.formDialog.edit_button;
                this.apikeysFormConf.method_ws = this.editCall;

                this.dialogService.dialogForm(this.apikeysFormConf);
            },
          }, {
            name: 'delete',
            id: "delete",
            icon: 'delete',
            label: "Delete",
            onClick: (rowinner) => {
                // do delete
            },
          }];
    }
}
